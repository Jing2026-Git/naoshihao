import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

/**
 * 脑师好 - 文档解析服务模块
 * 支持 PDF 和 Word (.docx) 文件的文本提取
 */

// 配置 pdfjs-dist 的 worker，支持 file:// 协议回退
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
} catch {
  // file:// 协议下 worker 不可用，禁用 worker（性能稍差但功能正常）
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
}

/**
 * 解析 PDF 文件，提取纯文本
 * @param {File} file - PDF 文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
export async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // 禁用 worker 以兼容 file:// 协议
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const textParts = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // 按位置排序文本项，保证阅读顺序正确
      const items = textContent.items
        .filter((item) => item.str !== undefined)
        .sort((a, b) => {
          if (a.transform[5] !== b.transform[5]) {
            return b.transform[5] - a.transform[5]; // Y 轴从上到下
          }
          return a.transform[4] - b.transform[4]; // X 轴从左到右
        });

      let lastY = null;
      for (const item of items) {
        const y = item.transform[5];
        // 如果 Y 坐标变化较大，视为换行
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          textParts.push('\n');
        }
        textParts.push(item.str);
        lastY = y;
      }

      textParts.push('\n\n'); // 页间分隔
    }

    const fullText = textParts.join('');

    if (!fullText.trim()) {
      throw new Error('PDF 文件中未提取到文本内容，可能为扫描版 PDF');
    }

    return fullText.trim();
  } catch (error) {
    if (error.message.includes('Invalid PDF')) {
      throw new Error('无法解析该 PDF 文件，文件可能已损坏或格式不受支持');
    }
    if (error.message.includes('password')) {
      throw new Error('该 PDF 文件受密码保护，暂不支持解析加密 PDF');
    }
    throw new Error(`PDF 解析失败：${error.message}`);
  }
}

/**
 * 解析 Word 文件，提取纯文本
 * @param {File} file - Word (.docx) 文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
export async function parseWord(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error('Word 文件中未提取到文本内容');
    }

    // 如果有警告信息，在控制台输出但不阻断流程
    if (result.messages?.length > 0) {
      const warnings = result.messages
        .filter((m) => m.type === 'warning')
        .map((m) => m.message);
      if (warnings.length > 0) {
        console.warn('[parseWord] 解析警告：', warnings.join('; '));
      }
    }

    return text;
  } catch (error) {
    if (error.message.includes('Could not find')) {
      throw new Error('无法解析该 Word 文件，请确保文件为 .docx 格式（不支持旧版 .doc）');
    }
    throw new Error(`Word 文档解析失败：${error.message}`);
  }
}

/**
 * 根据文件类型自动选择解析器
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
export async function parseDocument(file) {
  const { name, type } = file;
  const ext = name.split('.').pop()?.toLowerCase();

  if (type === 'application/pdf' || ext === 'pdf') {
    return parsePDF(file);
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return parseWord(file);
  }

  throw new Error(
    `不支持的文件格式（.${ext}）。目前仅支持 PDF 和 Word (.docx) 文件`,
  );
}
