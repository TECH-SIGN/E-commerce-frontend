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
  Divider
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  suggestions?: { label: string; action: string }[];
  type?: string;
  metadata?: any;
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      
      // Handle the correct API response format
      if (data.messages && data.messages.length > 0) {
        console.log('Processing messages:', data.messages);
        
        // Create all bot messages at once
        const botMessages: Message[] = [];
        
        // Process all messages from the API response
        for (let i = 0; i < data.messages.length; i++) {
          const apiMessage = data.messages[i];
          console.log(`Processing message ${i}:`, apiMessage);
          
          const botMsg: Message = {
            sender: 'bot',
            text: apiMessage.content || 'Additional information',
            type: apiMessage.type,
            metadata: apiMessage.metadata
          };
          
          // Add suggestions only to the first message
          if (i === 0 && data.suggestions && data.suggestions.length > 0) {
            botMsg.suggestions = data.suggestions.map((s: any) => ({
              label: s.text || s.label,
              action: s.action || s.url
            }));
          }
          
          botMessages.push(botMsg);
        }
        
        console.log('Final bot messages:', botMessages);
        
        // Add all messages at once
        setMessages((msgs) => [...msgs, ...botMessages]);
      } else if (data.reply) {
        // Fallback for old format
      const botMsg: Message = { sender: 'bot', text: data.reply };
      if (data.suggestions) {
        botMsg.suggestions = data.suggestions;
      }
      setMessages((msgs) => [...msgs, botMsg]);
      } else {
        // Default response if no message found
        setMessages((msgs) => [...msgs, { 
          sender: 'bot', 
          text: 'I\'m here to help! How can I assist you today?' 
        }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((msgs) => [...msgs, { 
        sender: 'bot', 
        text: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (action: string, label: string, event?: React.MouseEvent) => {
    console.log('Suggestion clicked:', { action, label });
    
    // Prevent any default navigation
    event?.preventDefault();
    
    // Send the action as a message to the chatbot
    const userMsg: Message = { sender: 'user', text: label };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: label,
          action: action 
        })
      });
      const data = await res.json();
      console.log('Chatbot response:', data);
      
      // Handle the response
      if (data.messages && data.messages.length > 0) {
        const firstMessage = data.messages[0];
        const botMsg: Message = { 
          sender: 'bot', 
          text: firstMessage.content || firstMessage.message || 'Processing your request...',
          type: firstMessage.type,
          metadata: firstMessage.metadata
        };
        
        // Handle new suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          botMsg.suggestions = data.suggestions.map((s: any) => ({
            label: s.text || s.label,
            action: s.action || s.url  // Store action instead of url
          }));
        }
        
        setMessages((msgs) => [...msgs, botMsg]);
        
        // Handle additional messages (like order status)
        if (data.messages.length > 1) {
          for (let i = 1; i < data.messages.length; i++) {
            const additionalMessage = data.messages[i];
            const additionalBotMsg: Message = {
              sender: 'bot',
              text: additionalMessage.content || 'Additional information',
              type: additionalMessage.type,
              metadata: additionalMessage.metadata
            };
            setMessages((msgs) => [...msgs, additionalBotMsg]);
          }
        }
      } else {
        setMessages((msgs) => [...msgs, { 
          sender: 'bot', 
          text: 'Processing your request...' 
        }]);
      }
    } catch (err) {
      console.error('Suggestion click error:', err);
      setMessages((msgs) => [...msgs, { 
        sender: 'bot', 
        text: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>
        <IconButton
          color="primary"
          size="large"
          onClick={() => setIsOpen(true)}
          sx={{ bgcolor: 'white', boxShadow: 3 }}
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      </Box>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90vw', sm: '400px', md: '500px' },
            maxWidth: '500px',
            height: { xs: '80vh', sm: '600px', md: '700px' },
            maxHeight: '700px',
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
                borderBottom: '1px solid #eee'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                  <ChatIcon />
                </Avatar>
                <Typography variant="h6">Support</Typography>
              </Box>
              <IconButton onClick={() => setIsOpen(false)}>
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
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                        color: msg.sender === 'user' ? 'white' : 'black',
                        borderRadius: 2,
                        maxWidth: '80%',
                        wordBreak: 'break-word'
                      }}
                    >
                      <ListItemText primary={msg.text} />
                      
                      {/* Render order status if available */}
                      {msg.type === 'order_status' && msg.metadata?.orders && (
                        <Box sx={{ mt: 1 }}>
                          {Array.isArray(msg.metadata.orders) && msg.metadata.orders.length > 0 ? (
                            msg.metadata.orders.map((order: any, index: number) => (
                              <Paper key={index} sx={{ p: 1, mb: 1, bgcolor: '#f5f5f5' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  Order #{order.id || order.order_id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Status: {order.status || 'Processing'}
                                </Typography>
                                {order.total && (
                                  <Typography variant="body2" color="text.secondary">
                                    Total: ₹{order.total}
                                  </Typography>
                                )}
                                {order.created_at && (
                                  <Typography variant="body2" color="text.secondary">
                                    Date: {new Date(order.created_at).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Paper>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No orders found
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* Render product cards if available */}
                      {msg.type === 'product_card' && msg.metadata?.product && (
                        <Box sx={{ mt: 1 }}>
                          <Paper 
                            sx={{ 
                              p: 2, 
                              mb: 1, 
                              bgcolor: '#f8f9fa',
                              cursor: 'pointer',
                              border: '1px solid #e0e0e0',
                              '&:hover': { 
                                bgcolor: '#e9ecef',
                                boxShadow: 2
                              }
                            }}
                            onClick={() => {
                              console.log('Product card clicked:', msg.metadata.product);
                              // Navigate to product detail page
                              window.open(`/products/${msg.metadata.product.id}`, '_blank');
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              {/* Product Image or Placeholder */}
                              <Box 
                                sx={{ 
                                  width: 80, 
                                  height: 80, 
                                  bgcolor: '#e0e0e0',
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  overflow: 'hidden'
                                }}
                              >
                                {msg.metadata.product.image_url ? (
                                  <img 
                                    src={msg.metadata.product.image_url} 
                                    alt={msg.metadata.product.name}
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (nextElement) {
                                        nextElement.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ 
                                    display: msg.metadata.product.image_url ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  No Image
                                </Typography>
                              </Box>
                              
                              {/* Product Details */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5, wordBreak: 'break-word' }}>
                                  {msg.metadata.product.name}
                                </Typography>
                                {msg.metadata.product.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                                    {msg.metadata.product.description}
                                  </Typography>
                                )}
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                                  ₹{msg.metadata.product.price}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  {msg.metadata.product.rating > 0 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      ⭐ {msg.metadata.product.rating}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                    {msg.metadata.product.in_stock ? '✅ In Stock' : '❌ Out of Stock'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      )}
                      
                      {msg.suggestions && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {msg.suggestions.map((s, i) => (
                            <Button
                              key={i}
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSuggestionClick(s.action, s.label, e);
                              }}
                            >
                              {s.label}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </ListItem>
                ))}
                <div ref={chatEndRef} />
              </List>
            </Box>

            <Divider />

            {/* Input Field */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderTop: '1px solid #eee' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                disabled={loading}
              />
              <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Modal>
    </>
  );
};

export default ChatbotWidget;
