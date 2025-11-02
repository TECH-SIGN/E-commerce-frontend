import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Modal,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useNavigate } from 'react-router-dom';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  queryType?: string;
  suggestions?: { text: string; action: string }[];
}

interface ChatbotResponse {
  success: boolean;
  message: string;
  queryType: string;
  dataFetched: boolean;
  timestamp: string;
  sessionId: string;
  suggestions: { text: string; action: string }[];
}

const AIChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'bot', 
      text: 'Hi! I\'m your AI shopping assistant. I can help you with:\n\n• Order status and tracking\n• Recent purchases\n• Product recommendations\n• Pending orders\n\nWhat would you like to know?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { 
      sender: 'user', 
      text: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: input,
          sessionId: sessionId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatbotResponse = await response.json();
      
      if (data.success) {
        const botMsg: Message = { 
          sender: 'bot', 
          text: data.message,
          timestamp: data.timestamp,
          queryType: data.queryType,
          suggestions: data.suggestions
        };
        
        setMessages((msgs) => [...msgs, botMsg]);
        
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((msgs) => [...msgs, { 
        sender: 'bot', 
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (action: string) => {
    setOpen(false);
    
    // Navigate based on action
    switch (action) {
      case 'view_orders':
        navigate('/orders');
        break;
      case 'order_history':
        navigate('/orders');
        break;
      case 'browse_products':
        navigate('/products');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'support':
        navigate('/contact');
        break;
      default:
        navigate('/');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>
        <IconButton
          color="primary"
          size="large"
          onClick={() => setOpen(true)}
          sx={{ 
            bgcolor: 'white', 
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'grey.50'
            }
          }}
        >
          <SmartToyIcon fontSize="large" />
        </IconButton>
      </Box>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 380,
            height: 600,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Paper elevation={3} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: '1px solid #eee',
                bgcolor: 'primary.main',
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'white', mr: 1 }}>
                  <SmartToyIcon color="primary" />
                </Avatar>
                <Box>
                  <Typography variant="h6">AI Assistant</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Powered by Local AI
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: '#f9f9f9'
              }}
            >
              <List sx={{ padding: 0 }}>
                {messages.map((msg, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                        color: msg.sender === 'user' ? 'white' : 'black',
                        borderRadius: 2,
                        maxWidth: '85%',
                        wordBreak: 'break-word',
                        boxShadow: 1
                      }}
                    >
                      <ListItemText 
                        primary={msg.text}
                        sx={{
                          '& .MuiListItemText-primary': {
                            whiteSpace: 'pre-line'
                          }
                        }}
                      />
                      
                      {msg.queryType && (
                        <Chip 
                          label={msg.queryType.replace('_', ' ')} 
                          size="small" 
                          sx={{ mt: 1, fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {msg.suggestions && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {msg.suggestions.map((s, i) => (
                            <Button
                              key={i}
                              variant="outlined"
                              size="small"
                              onClick={() => handleSuggestionClick(s.action)}
                              sx={{ 
                                fontSize: '0.75rem',
                                textTransform: 'none'
                              }}
                            >
                              {s.text}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </ListItem>
                ))}
                
                {loading && (
                  <ListItem sx={{ justifyContent: 'flex-start' }}>
                    <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          AI is thinking...
                        </Typography>
                      </Box>
                    </Paper>
                  </ListItem>
                )}
                
                <div ref={chatEndRef} />
              </List>
            </Box>

            <Divider />

            {/* Input Field */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderTop: '1px solid #eee' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me about your orders, purchases, or products..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <IconButton 
                color="primary" 
                onClick={handleSend} 
                disabled={loading || !input.trim()}
                sx={{ ml: 1 }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Modal>
    </>
  );
};

export default AIChatbotWidget; 