import { useState, useEffect, useCallback, useRef } from 'react'

// Components
import TopBar from './components/TopBar'
import SettingsModal from './components/SettingsModal'
import LabProfilePanel from './components/LabProfilePanel'
import PaperViewer from './components/PaperViewer'
import ChatPanel from './components/ChatPanel'

// Services
import { parseDocument } from './services/parser'
import { callAI, callAINonStream } from './services/api'
import { buildSystemPrompt } from './services/systemPrompt'

// DB helpers
import {
  getSettings,
  savePaper,
  getConversationByPaper,
  saveConversation,
  getLabProfile,
  saveLabProfile,
} from './db'

// ── 思维模型标签配置 ──────────────────────────────────────────────
const THINKING_MODELS = [
  { name: '苏格拉底诘问法', color: 'bg-[rgba(251,191,36,0.15)] text-amber-300 border-[rgba(251,191,36,0.3)]' },
  { name: '第一性原理', color: 'bg-[rgba(52,211,153,0.15)] text-emerald-300 border-[rgba(52,211,153,0.3)]' },
  { name: '布鲁姆认知金字塔', color: 'bg-[rgba(96,165,250,0.15)] text-blue-300 border-[rgba(96,165,250,0.3)]' },
  { name: '水平思考法', color: 'bg-[rgba(167,139,250,0.15)] text-purple-300 border-[rgba(167,139,250,0.3)]' },
]

/**
 * 从 AI 回复内容中检测思维模型标签
 */
function extractModelTag(content) {
  const marker = '【思维模型选择】'
  const idx = content.indexOf(marker)
  if (idx === -1) {
    return { modelLabel: null, colorClass: null, cleanContent: content }
  }

  // 只提取【思维模型选择】模块的内容（到下一个 # 或 --- 或空行开头）
  const moduleMatch = content.match(/【思维模型选择】[\s\S]*?(?=\n#|\n---|\n\n[A-Z\u4e00-\u9fff]|\z)/)
  const moduleText = moduleMatch ? moduleMatch[0] : ''

  // 在模块内容中查找"选择的模型："后面的模型名称
  let matchedModel = null
  const choiceMatch = moduleText.match(/选择的模型[：:]\s*(.+)/)
  if (choiceMatch) {
    const chosenName = choiceMatch[1].trim()
    for (const model of THINKING_MODELS) {
      if (chosenName.includes(model.name)) {
        matchedModel = model
        break
      }
    }
  }

  // 如果没找到，退回到在模块内搜索
  if (!matchedModel) {
    for (const model of THINKING_MODELS) {
      if (moduleText.includes(model.name)) {
        matchedModel = model
        break
      }
    }
  }

  if (matchedModel) {
    // 移除整个【思维模型选择】...段落
    const regex = /【思维模型选择】[\s\S]*?(?=\n#|\n---|\n\n[A-Z\u4e00-\u9fff]|\z)/
    const cleanContent = content.replace(regex, '').trim()
    return {
      modelLabel: matchedModel.name,
      colorClass: matchedModel.color,
      cleanContent: cleanContent || content,
    }
  }

  return { modelLabel: null, colorClass: null, cleanContent: content }
}

/**
 * 解析 AI 返回的实验室档案为结构化数据
 */
function parseProfileResponse(text) {
  const profile = {
    directions: [],
    literatureTypes: [],
    researchQuestions: [],
    techniques: [],
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.directions) profile.directions = parsed.directions
      if (parsed.literatureTypes) profile.literatureTypes = parsed.literatureTypes
      if (parsed.researchQuestions) profile.researchQuestions = parsed.researchQuestions
      if (parsed.techniques) profile.techniques = parsed.techniques
      return profile
    }
  } catch {
    // JSON 解析失败，尝试文本解析
  }

  // 文本解析：按段落提取
  const sections = text.split(/\n(?=[^\n]*[：:])/)
  for (const section of sections) {
    const lower = section.toLowerCase()
    if (lower.includes('方向') || lower.includes('direction')) {
      profile.directions = extractListItems(section)
    } else if (lower.includes('文献') || lower.includes('literature') || lower.includes('类型')) {
      profile.literatureTypes = extractListItems(section)
    } else if (lower.includes('问题') || lower.includes('question')) {
      profile.researchQuestions = extractListItems(section)
    } else if (lower.includes('技术') || lower.includes('technique') || lower.includes('方法')) {
      profile.techniques = extractListItems(section)
    }
  }

  return profile
}

function extractListItems(text) {
  const items = []
  const lines = text.split('\n')
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim()
    if (cleaned.length > 0 && cleaned !== text.trim()) {
      items.push(cleaned)
    }
  }
  if (items.length === 0) {
    const content = text.replace(/^[^：:]+[：:]\s*/, '').trim()
    if (content) {
      items.push(...content.split(/[,;，；]/).map((s) => s.trim()).filter(Boolean))
    }
  }
  return items
}

export default function App() {
  // ── 状态管理 ────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [labProfileOpen, setLabProfileOpen] = useState(false)
  const [currentPaper, setCurrentPaper] = useState(null)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingPaper, setIsLoadingPaper] = useState(false)
  const [labProfile, setLabProfile] = useState(null)
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false)

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // ── 初始化：加载实验室档案 ─────────────────────────────────────
  useEffect(() => {
    getLabProfile().then((profile) => {
      if (profile) setLabProfile(profile)
    }).catch((err) => console.error('加载实验室档案失败:', err))
  }, [])

  // ── 论文上传处理 ────────────────────────────────────────────────
  const handlePaperUpload = useCallback(async (file) => {
    setIsLoadingPaper(true)
    try {
      const textContent = await parseDocument(file)

      // 从文本中提取标题（取第一行非空行）
      const lines = textContent.split('\n').filter((l) => l.trim())
      const title = lines[0]?.slice(0, 100) || file.name

      const paperId = await savePaper({
        title,
        textContent,
        fileName: file.name,
      })

      const paper = { id: paperId, title, textContent }
      setCurrentPaper(paper)

      try {
        const existing = await getConversationByPaper(paperId)
        if (existing?.messages?.length > 0) {
          setMessages(existing.messages)
        } else {
          setMessages([])
        }
      } catch {
        setMessages([])
      }
    } catch (err) {
      console.error('论文解析失败:', err)
      alert('论文解析失败，请检查文件格式是否支持。')
    } finally {
      setIsLoadingPaper(false)
    }
  }, [])

  // ── 发送消息处理 ────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (text) => {
      const userMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      }

      const newMessages = [...messagesRef.current, userMessage]
      setMessages(newMessages)

      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }
      const withAssistant = [...newMessages, assistantMessage]
      setMessages(withAssistant)
      setIsTyping(true)

      try {
        const systemPrompt = buildSystemPrompt({
          paperContent: currentPaper?.textContent || '',
          labProfile,
        })

        const chatMessages = [
          { role: 'system', content: systemPrompt },
          ...newMessages.map((m) => ({ role: m.role, content: m.content })),
        ]

        let accumulated = ''
        const gen = callAI(chatMessages)

        while (true) {
          const { value: chunk, done } = await gen.next()
          if (done) break
          accumulated += chunk

          const updated = [...messagesRef.current]
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: accumulated,
            }
            setMessages(updated)
            messagesRef.current = updated
          }
        }

        // 提取思维模型标签
        const finalMessages = [...messagesRef.current]
        const lastMsg = { ...finalMessages[finalMessages.length - 1] }
        const { modelLabel, colorClass, cleanContent } = extractModelTag(lastMsg.content)
        lastMsg.content = cleanContent
        if (modelLabel) {
          lastMsg.modelLabel = modelLabel
          lastMsg.colorClass = colorClass
        }
        finalMessages[finalMessages.length - 1] = lastMsg
        setMessages(finalMessages)
        messagesRef.current = finalMessages

        // 保存对话
        if (currentPaper?.id) {
          try {
            await saveConversation({
              paperId: currentPaper.id,
              messages: finalMessages,
            })
          } catch (err) {
            console.error('保存对话失败:', err)
          }
        }
      } catch (err) {
        console.error('AI 调用失败:', err)
        const errorMessages = [...messagesRef.current]
        if (errorMessages.length > 0) {
          errorMessages[errorMessages.length - 1] = {
            role: 'assistant',
            content: `抱歉，AI 调用出现错误：${err.message || '未知错误'}。请检查 API 设置后重试。`,
            timestamp: new Date().toISOString(),
          }
          setMessages(errorMessages)
          messagesRef.current = errorMessages
        }
      } finally {
        setIsTyping(false)
      }
    },
    [currentPaper, labProfile]
  )

  // ── 实验室档案更新处理 ──────────────────────────────────────────
  const handleLabProfileUpdate = useCallback(async (profile) => {
    try {
      await saveLabProfile(profile)
      setLabProfile(profile)
    } catch (err) {
      console.error('保存实验室档案失败:', err)
      alert('保存实验室档案失败，请重试。')
    }
  }, [])

  // ── 实验室档案文件上传处理 ──────────────────────────────────────
  const handleLabProfileFilesUpload = useCallback(
    async (files) => {
      if (!files || files.length === 0) return

      setIsGeneratingProfile(true)
      try {
        let combinedText = ''

        for (const file of files) {
          const ext = file.name.split('.').pop().toLowerCase()

          if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
            const text = await file.text()
            combinedText += `\n\n--- ${file.name} ---\n${text}`
          } else if (ext === 'pdf') {
            try {
              const textContent = await parseDocument(file)
              combinedText += `\n\n--- ${file.name} ---\n${textContent}`
            } catch (err) {
              console.error(`解析 ${file.name} 失败:`, err)
            }
          }
        }

        if (!combinedText.trim()) {
          alert('未能从上传的文件中提取到任何文本内容。')
          return
        }

        const prompt = `请根据以下研究组相关文件内容，分析该研究组的研究方向和特征，并以 JSON 格式返回结构化的实验室档案。

要求返回的 JSON 格式如下：
{
  "directions": ["研究方向1", "研究方向2", ...],
  "literatureTypes": ["文献类型1", "文献类型2", ...],
  "researchQuestions": ["核心研究问题1", "核心研究问题2", ...],
  "techniques": ["技术方法1", "技术方法2", ...]
}

字段说明：
- directions: 该研究组的主要研究方向（3-5个）
- literatureTypes: 该研究组常关注的文献类型（如：fMRI研究、EEG研究、行为实验、元分析等）
- researchQuestions: 该研究组关注的核心研究问题（3-5个）
- techniques: 该研究组常用的实验技术和分析方法（3-5个）

请仅返回 JSON，不要包含其他文字说明。

以下是文件内容：
${combinedText.slice(0, 30000)}`

        const response = await callAINonStream([
          {
            role: 'system',
            content: '你是一个认知神经科学领域的研究分析专家，擅长从论文和文件中提取研究组的研究特征。请严格按照要求的 JSON 格式返回结果。',
          },
          { role: 'user', content: prompt },
        ])

        const profile = parseProfileResponse(response)
        await handleLabProfileUpdate(profile)
      } catch (err) {
        console.error('生成实验室档案失败:', err)
        alert(`生成实验室档案失败：${err.message || '未知错误'}`)
      } finally {
        setIsGeneratingProfile(false)
      }
    },
    [handleLabProfileUpdate]
  )

  // ── 渲染 ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenLabProfile={() => setLabProfileOpen(true)}
        hasLabProfile={!!labProfile}
      />

      <main className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[45%] min-w-0 border-r border-[rgba(255,255,255,0.06)]">
          <PaperViewer
            paper={currentPaper}
            isLoading={isLoadingPaper}
            onPaperUpload={handlePaperUpload}
          />
        </div>
        <div className="w-[55%] min-w-0">
          <ChatPanel
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            hasPaper={!!currentPaper}
          />
        </div>
      </main>

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {labProfileOpen && (
        <LabProfilePanel
          isOpen={labProfileOpen}
          profile={labProfile}
          onUpdate={handleLabProfileUpdate}
          onFilesUpload={handleLabProfileFilesUpload}
          isGenerating={isGeneratingProfile}
          onClose={() => setLabProfileOpen(false)}
        />
      )}
    </div>
  )
}
