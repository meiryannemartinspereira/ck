
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Minus, Send, X } from 'lucide-react'
import '../../styles/ChatWidget.css'

type ChatMessage = {
  sender: string
  message: string
}

type ServerMessage =
  | { type: 'history'; messages: ChatMessage[] }
  | ({ type: 'message' } & ChatMessage)
  | { type: 'error'; message: string }

const MAX_MESSAGE_LENGTH = 1000

function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const backendUrl = import.meta.env.VITE_API_URL

  if (backendUrl) {
    const url = new URL(backendUrl)
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${url.host}/ws`
  }

  return `${protocol}//${window.location.hostname}:8000/ws`
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected')
  const [error, setError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let socket: WebSocket

    try {
      socket = new WebSocket(getWebSocketUrl())
      socketRef.current = socket
      setConnectionStatus('connecting')
      setError('')
    } catch {
      setConnectionStatus('disconnected')
      setError('Não foi possível conectar ao chat.')
      return
    }

    socket.onopen = () => {
      setConnectionStatus('connected')
      setError('')
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage

        if (data.type === 'history') {
          setMessages(data.messages)
        } else if (data.type === 'message') {
          setMessages((current) => [
            ...current,
            {
              sender: data.sender,
              message: data.message,
            },
          ])

          if (!isOpen) {
            setHasNewMessage(true)
          }
        } else if (data.type === 'error') {
          setError(data.message)
        }
      } catch {
        setError('Não foi possível interpretar uma mensagem recebida.')
      }
    }

    socket.onerror = () => {
      setError('Erro na conexão com o chat.')
    }

    socket.onclose = () => {
      setConnectionStatus('disconnected')

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }

    return () => {
      socket.close()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const text = message.trim()
    const socket = socketRef.current

    if (!text || text.length > MAX_MESSAGE_LENGTH) return

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Chat desconectado. Tente abrir o chat novamente.')
      return
    }

    socket.send(JSON.stringify({ message: text }))
    setMessage('')
    setError('')
  }

  function toggleChat() {
    setIsOpen((current) => !current)
    setHasNewMessage(false)
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <section className="chat-window" aria-label="Chat CK-Cachoeirinha">
          <header className="chat-header">
            <div className="chat-heading">
              <div className="chat-avatar">
                <MessageCircle size={22} />
              </div>

              <div>
                <h2>CK-Cachoeirinha</h2>
                <span className={`chat-status ${connectionStatus}`}>
                  {connectionStatus === 'connected'
                    ? 'Conectado'
                    : connectionStatus === 'connecting'
                      ? 'Conectando...'
                      : 'Desconectado'}
                </span>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                aria-label="Minimizar chat"
                onClick={toggleChat}
              >
                <Minus size={20} />
              </button>

              <button
                type="button"
                aria-label="Fechar chat"
                onClick={toggleChat}
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-empty">
                <MessageCircle size={32} />
                <p>Nenhuma mensagem ainda.</p>
                <span>Envie uma mensagem para começar!</span>
              </div>
            )}

            {messages.map((item, index) => (
              <article
                className="chat-message"
                key={`${index}-${item.message}`}
              >
                <strong>{item.sender}</strong>
                <p>{item.message}</p>
              </article>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}

          <form className="chat-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite sua mensagem..."
              aria-label="Mensagem"
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={connectionStatus !== 'connected'}
            />

            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={
                !message.trim() || connectionStatus !== 'connected'
              }
            >
              <Send size={19} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`chat-toggle${hasNewMessage && !isOpen ? ' has-new-message' : ''}`}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
        onClick={toggleChat}
      >
        {isOpen ? <X size={25} /> : <MessageCircle size={25} />}
      </button>
    </div>
  )
}
