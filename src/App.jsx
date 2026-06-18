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
  getAllStudentProfiles,
  getAllPapers,
  deletePaper,
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
    journalQuality: [],
    researchParadigm: [],
    qualityStandards: [],
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.directions) profile.directions = parsed.directions
      if (parsed.literatureTypes) profile.literatureTypes = parsed.literatureTypes
      if (parsed.researchQuestions) profile.researchQuestions = parsed.researchQuestions
      if (parsed.techniques) profile.techniques = parsed.techniques
      if (parsed.journalQuality) profile.journalQuality = parsed.journalQuality
      if (parsed.researchParadigm) profile.researchParadigm = parsed.researchParadigm
      if (parsed.qualityStandards) profile.qualityStandards = parsed.qualityStandards
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
    } else if (lower.includes('期刊') || lower.includes('journal')) {
      profile.journalQuality = extractListItems(section)
    } else if (lower.includes('范式') || lower.includes('paradigm')) {
      profile.researchParadigm = extractListItems(section)
    } else if (lower.includes('质量') || lower.includes('quality') || lower.includes('标准')) {
      profile.qualityStandards = extractListItems(section)
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
  const [papers, setPapers] = useState([])
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingPaper, setIsLoadingPaper] = useState(false)
  const [labProfile, setLabProfile] = useState(null)
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false)
  const [students, setStudents] = useState([])
  const [activeStudentId, setActiveStudentId] = useState(null)

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // ── 初始化：加载论文列表、实验室档案和同门列表 ────────────────
  useEffect(() => {
    getAllPapers().then((list) => {
      setPapers(list)
      // 默认选中最后一篇
      if (list.length > 0) {
        setCurrentPaper(list[0])
        // 加载对应对话
        (async () => {
          try {
            const existing = await getConversationByPaper(list[0].id, activeStudentId)
            if (existing?.messages?.length > 0) {
              setMessages(existing.messages)
            }
          } catch {}
        })()
      }
    }).catch((err) => console.error('加载论文列表失败:', err))

    getLabProfile().then((profile) => {
      if (profile) setLabProfile(profile)
    }).catch((err) => console.error('加载实验室档案失败:', err))

    getAllStudentProfiles().then((list) => {
      setStudents(list)
    }).catch((err) => console.error('加载同门列表失败:', err))
  }, [])

  // ── 切换论文 ─────────────────────────────────────────────────────
  const handleSelectPaper = useCallback(async (paper) => {
    setCurrentPaper(paper)
    try {
      const existing = await getConversationByPaper(paper.id, activeStudentId)
      if (existing?.messages?.length > 0) {
        setMessages(existing.messages)
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
  }, [activeStudentId])

  // ── 删除论文 ─────────────────────────────────────────────────────
  const handleDeletePaper = useCallback(async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('确定要删除这篇论文吗？删除后对话也会被删除。')) return

    await deletePaper(id)
    setPapers(prev => prev.filter(p => p.id !== id))
    if (currentPaper?.id === id) {
      if (papers.length > 1) {
        const remaining = papers.filter(p => p.id !== id)
        setCurrentPaper(remaining[0])
        // 加载对应对话
        (async () => {
          try {
            const existing = await getConversationByPaper(remaining[0].id, activeStudentId)
            if (existing?.messages?.length > 0) {
              setMessages(existing.messages)
            } else {
              setMessages([])
            }
          } catch {}
        })()
      } else {
        setCurrentPaper(null)
        setMessages([])
      }
    }
  }, [currentPaper, papers, activeStudentId])

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

      const paper = { id: paperId, title, textContent, fileName: file.name, uploadDate: new Date().toISOString() }
      setCurrentPaper(paper)
      setPapers(prev => [paper, ...prev])

      try {
        const existing = await getConversationByPaper(paperId, activeStudentId)
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
  }, [activeStudentId])

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
        const activeStudent = activeStudentId ? students.find(s => s.id === activeStudentId) : null
        const systemPrompt = buildSystemPrompt({
          paperContent: currentPaper?.textContent || '',
          labProfile,
          studentProfile: activeStudent || null,
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
              studentId: activeStudentId,
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

  // ── 删除消息 ────────────────────────────────────────────────────
  const handleDeleteMessage = useCallback((idx) => {
    setMessages((prev) => {
      const newMessages = prev.filter((_, i) => i !== idx)
      // 同步保存到数据库
      if (currentPaper?.id) {
        saveConversation({
          paperId: currentPaper.id,
          studentId: activeStudentId,
          messages: newMessages,
        }).catch((err) => console.error('保存对话失败:', err))
      }
      return newMessages
    })
  }, [currentPaper, activeStudentId])

  // ── 重新生成消息 ────────────────────────────────────────────────
  const handleRegenerateMessage = useCallback(async (idx) => {
    // 找到要重发的用户问题（往前找最近的用户消息）
    let userQuestion = null
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        userQuestion = messages[i].content
        break
      }
    }

    if (!userQuestion) return

    // 删除这条 AI 回复及之后的所有消息
    const newMessages = messages.slice(0, idx)
    setMessages(newMessages)

    // 重新调用 AI
    setIsTyping(true)
    try {
      const activeStudent = activeStudentId ? students.find(s => s.id === activeStudentId) : null
      const systemPrompt = buildSystemPrompt({
        paperContent: currentPaper?.textContent || '',
        labProfile,
        studentProfile: activeStudent || null,
      })

      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ]

      const responseStream = callAI(fullMessages)
      let aiResponse = ''

      for await (const chunk of responseStream) {
        aiResponse += chunk
        setMessages((prev) => {
          const msgs = [...prev]
          if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: aiResponse,
            }
          } else {
            msgs.push({
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date().toISOString(),
            })
          }
          return msgs
        })
      }

      // 提取思维模型标签
      const { modelLabel, colorClass, cleanContent } = extractModelTag(aiResponse)
      const finalMessages = [
        ...newMessages,
        {
          role: 'assistant',
          content: cleanContent || aiResponse,
          modelLabel,
          colorClass,
          timestamp: new Date().toISOString(),
        },
      ]
      setMessages(finalMessages)

      if (currentPaper?.id) {
        await saveConversation({
          paperId: currentPaper.id,
          studentId: activeStudentId,
          messages: finalMessages,
        })
      }
    } catch (err) {
      console.error('重新生成失败:', err)
      alert(`重新生成失败：${err.message || '未知错误'}`)
    } finally {
      setIsTyping(false)
    }
  }, [currentPaper, labProfile, activeStudentId, students, messages])

  // ── 实验室档案更新处理 ──────────────────────────────────────────
  const handleLabProfileUpdate = useCallback(async (action) => {
    try {
      if (action.type === 'edit' && action.data) {
        // 编辑模式：直接用用户修改的数据
        const updatedProfile = {
          ...labProfile,
          ...action.data,
          updatedAt: new Date().toISOString(),
        }
        await saveLabProfile(updatedProfile)
        setLabProfile(updatedProfile)
      } else if (action.type === 'regenerate') {
        // 重新生成：清空画像
        await saveLabProfile(null)
        setLabProfile(null)
      } else {
        // 直接保存（AI 生成的结果）
        await saveLabProfile(action)
        setLabProfile(action)
      }
    } catch (err) {
      console.error('保存实验室档案失败:', err)
      alert('保存实验室档案失败，请重试。')
    }
  }, [labProfile])

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
  "techniques": ["技术方法1", "技术方法2", ...],
  "journalQuality": ["期刊质量偏好1", "期刊质量偏好2", ...],
  "researchParadigm": ["研究范式偏好1", "研究范式偏好2", ...],
  "qualityStandards": ["文献质量标准1", "文献质量标准2", ...]
}

字段说明：
- directions: 该研究组的主要研究方向（3-5个）
- literatureTypes: 该研究组常关注的文献类型（如：fMRI研究、EEG研究、行为实验、元分析等）
- researchQuestions: 该研究组关注的核心研究问题（3-5个）
- techniques: 该研究组常用的实验技术和分析方法（3-5个）
- journalQuality: 从上传文献发布的期刊档次、引用习惯，推断该研究组对期刊质量的偏好（如："高影响因子期刊（IF>5）"、"方法学创新优先"等，2-4个）
- researchParadigm: 从上传文献的内容，推断该研究组偏好的研究范式（如："计算建模驱动"、"大样本行为实验"、"多模态神经影像"等，2-4个）
- qualityStandards: 从上传文献的严谨度，推断该研究组对文献质量的要求（如："要求预注册"、"开放数据与代码"、"效应量报告"、"多重比较校正"等，2-4个）

请仅返回 JSON，不要包含其他文字说明。

以下是文件内容：
${combinedText.slice(0, 30000)}`

        const response = await callAINonStream([
          {
            role: 'system',
            content: '你是一个认知神经科学领域的研究分析专家，擅长从论文和文件中提取研究组的研究特征。请严格按照要求的 JSON 格式返回结果，包含 directions、literatureTypes、researchQuestions、techniques、journalQuality、researchParadigm、qualityStandards 七个字段。',
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
    <div className="flex flex-col h-full bg-transparent">
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
            papers={papers}
            currentPaperId={currentPaper?.id}
            onSelectPaper={handleSelectPaper}
            onDeletePaper={handleDeletePaper}
          />
        </div>
        <div className="w-[55%] min-w-0">
          <ChatPanel
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            hasPaper={!!currentPaper}
            students={students}
            activeStudentId={activeStudentId}
            onSelectStudent={setActiveStudentId}
            onDeleteMessage={handleDeleteMessage}
            onRegenerate={handleRegenerateMessage}
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
