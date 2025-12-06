import React, { type ReactNode } from 'react'
import { Typography, Box, Link, List, ListItem, ListItemText } from '@mui/material'

interface MarkdownRendererProps {
  content: string
}

/**
 * Парсит markdown контент и возвращает JSX элементы
 * Поддерживает: **жирный**, *курсив*, `код`, # заголовки, списки, линки
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parseMarkdown = (text: string): ReactNode[] => {
    const lines = text.split('\n')
    const elements: ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Пустые строки - добавляем небольшой gap
      if (!line.trim()) {
        elements.push(<Box key={`empty-${i}`} sx={{ mb: 1 }} />)
        i++
        continue
      }

      // Заголовки (# ## ###)
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
        const headingText = headingMatch[2]
        const variantMap = {
          1: 'h5' as const,
          2: 'h6' as const,
          3: 'subtitle1' as const,
          4: 'subtitle2' as const,
          5: 'body1' as const,
          6: 'body1' as const,
        }
        elements.push(
          <Typography
            key={`heading-${i}`}
            variant={variantMap[level]}
            sx={{ fontWeight: 'bold', mt: 1.5, mb: 0.5 }}
          >
            {parseInlineMarkdown(headingText)}
          </Typography>,
        )
        i++
        continue
      }

      // Неупорядоченные списки (- или *)
      if (line.match(/^[\s]*[-*]\s+/)) {
        const listItems = []
        while (i < lines.length && lines[i].match(/^[\s]*[-*]\s+/)) {
          const itemText = lines[i].replace(/^[\s]*[-*]\s+/, '')
          listItems.push(
            <ListItem key={`li-${i}`} sx={{ py: 0.3 }}>
              <ListItemText
                primary={parseInlineMarkdown(itemText)}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>,
          )
          i++
        }
        elements.push(
          <List key={`list-${i}`} sx={{ my: 1, pl: 2 }}>
            {listItems}
          </List>,
        )
        continue
      }

      // Упорядоченные списки (1. 2. и т.д.)
      if (line.match(/^[\s]*\d+\.\s+/)) {
        const listItems = []
        while (i < lines.length && lines[i].match(/^[\s]*\d+\.\s+/)) {
          const itemText = lines[i].replace(/^[\s]*\d+\.\s+/, '')
          listItems.push(
            <ListItem key={`li-${i}`} sx={{ py: 0.3 }}>
              <ListItemText
                primary={parseInlineMarkdown(itemText)}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>,
          )
          i++
        }
        elements.push(
          <List key={`list-${i}`} component="ol" sx={{ my: 1, pl: 2 }}>
            {listItems}
          </List>,
        )
        continue
      }

      // Блоки кода (``` ... ```)
      if (line.trim().startsWith('```')) {
        let codeContent = ''
        const language = line.slice(3).trim()
        i++

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeContent += lines[i] + '\n'
          i++
        }

        elements.push(
          <Box
            key={`code-${i}`}
            sx={{
              bgcolor: '#f5f5f5',
              borderLeft: '4px solid #2196f3',
              p: 1.5,
              borderRadius: 1,
              my: 1,
              overflowX: 'auto',
            }}
          >
            {language && (
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                {language}
              </Typography>
            )}
            <Typography
              component="pre"
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {codeContent.trim()}
            </Typography>
          </Box>,
        )

        i++
        continue
      }

      // Обычный текст с инлайн форматированием
      elements.push(
        <Typography key={`text-${i}`} variant="body2" sx={{ mb: 1 }}>
          {parseInlineMarkdown(line)}
        </Typography>,
      )

      i++
    }

    return elements
  }

  /**
   * Парсит инлайн форматирование: **жирный**, *курсив*, `код`, [текст](ссылка)
   */
  const parseInlineMarkdown = (text: string): ReactNode[] => {
    const elements: ReactNode[] = []
    let lastIndex = 0

    // Регулярное выражение для поиска: **text**, *text*, `code`, [text](url)
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)]\(([^)]+)\)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      // Добавляем текст до совпадения
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index))
      }

      if (match[1]) {
        // **жирный**
        elements.push(
          <strong key={`bold-${match.index}`} style={{ fontWeight: 'bold' }}>
            {match[1]}
          </strong>,
        )
      } else if (match[2]) {
        // *курсив*
        elements.push(
          <em key={`italic-${match.index}`} style={{ fontStyle: 'italic' }}>
            {match[2]}
          </em>,
        )
      } else if (match[3]) {
        // `код`
        elements.push(
          <code
            key={`code-${match.index}`}
            style={{
              backgroundColor: '#f5f5f5',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            }}
          >
            {match[3]}
          </code>,
        )
      } else if (match[4] && match[5]) {
        // [текст](ссылка)
        elements.push(
          <Link
            key={`link-${match.index}`}
            href={match[5]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[4]}
          </Link>,
        )
      }

      lastIndex = regex.lastIndex
    }

    // Добавляем остаток текста
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex))
    }

    return elements.length ? elements : [text]
  }

  return <Box sx={{ width: '100%' }}>{parseMarkdown(content)}</Box>
}
