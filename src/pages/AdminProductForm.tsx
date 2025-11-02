import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, Stepper, Step, StepLabel, TextField, Typography, Paper, Grid, InputAdornment, Chip, Stack, Alert, CircularProgress, Select, MenuItem, IconButton, SelectChangeEvent, FormControl, InputLabel, FormControlLabel, Switch, Divider, Accordion, AccordionSummary, AccordionDetails, Rating, Autocomplete, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';

import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { getAllCategorySpecs, getCategorySpecs } from '../store/slices/productSlice';
import api from '../services/api';

interface Dimensions {
  length: string;
  width: string;
  height: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  brand: string;
  stock: string;
  images: File[];
  sku: string;
  weight: string;
  dimensions: Dimensions;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  specifications: Record<string, any>;
  category_specific: Record<string, any>;
  search_keywords: string;
  colors: string[];
  sizes: string[];
  variants: Array<{ id?: string; color?: string; size?: string; sku?: string; price?: number; stock: number; active?: boolean }>
}

const initialForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  brand: '',
  stock: '',
  images: [],
  sku: '',
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  tags: [],
  metaTitle: '',
  metaDescription: '',
  specifications: {},
  category_specific: {},
  search_keywords: '',
  colors: [],
  sizes: [],
  variants: []
};

const steps = [
  'Basic Info', 'Category & Specifications', 'Pricing & Inventory', 'Images', 'SEO & Tags', 'Summary'
];

const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { categorySpecs, currentCategorySpecs } = useSelector((state: RootState) => state.products);
  
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loadingCategorySpecs, setLoadingCategorySpecs] = useState(false);

  // Load category specifications on mount
  useEffect(() => {
    console.log('🔄 Loading category specifications...');
    dispatch(getAllCategorySpecs());
  }, [dispatch]);

  // Debug categorySpecs loading
  useEffect(() => {
    console.log('📊 categorySpecs state:', categorySpecs);
    console.log('📊 categorySpecs length:', categorySpecs?.length);
  }, [categorySpecs]);

  // Load category-specific specs when category changes
  useEffect(() => {
    if (form.category) {
      console.log('🔄 Loading specs for category:', form.category);
      dispatch(getCategorySpecs(form.category));
    }
  }, [form.category, dispatch]);

  // Debug currentCategorySpecs loading
  useEffect(() => {
    console.log('📊 currentCategorySpecs state:', currentCategorySpecs);
    console.log('📊 currentCategorySpecs type:', typeof currentCategorySpecs);
    console.log('📊 currentCategorySpecs keys:', currentCategorySpecs ? Object.keys(currentCategorySpecs) : 'null');
    console.log('📊 form.category:', form.category);
  }, [currentCategorySpecs, form.category]);

  // Load product for editing
  useEffect(() => {
    if (id) {
      setEditMode(true);
      setLoading(true);
      api.get(`/api/products/${id}`)
        .then(res => {
          const p = res.data;
          setForm({
            name: p.name || '',
            description: p.description || '',
            price: p.price?.toString() || '',
            category: p.category || '',
            brand: p.brand || '',
            stock: p.stock?.toString() || '',
            images: [],
            sku: p.sku || '',
            weight: p.weight?.toString() || '',
            dimensions: {
              length: p.dimensions?.length?.toString() || '',
              width: p.dimensions?.width?.toString() || '',
              height: p.dimensions?.height?.toString() || ''
            },
            tags: p.tags || [],
            metaTitle: p.metaTitle || p.meta_title || '',
            metaDescription: p.metaDescription || p.meta_description || '',
            specifications: p.specifications || {},
            category_specific: p.category_specific || {},
            search_keywords: p.search_keywords || '',
            colors: Array.isArray(p.variant_colors) ? p.variant_colors : [],
            sizes: Array.isArray(p.variant_sizes) ? p.variant_sizes : [],
            variants: Array.isArray(p.variants) ? p.variants.map((v: any) => ({
              id: v.id,
              color: v.color,
              size: v.size,
              sku: v.sku,
              price: v.price,
              stock: typeof v.stock === 'number' ? v.stock : Number(v.stock) || 0,
              active: v.active !== false
            })) : []
          });
          setPreviewImages(p.images || []);
        })
        .catch(() => setError('Failed to load product for editing.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Validation per step
  const validateStep = () => {
    const e: Partial<Record<keyof ProductForm, string>> = {};
    
    if (activeStep === 0) {
      if (!form.name.trim()) e.name = 'Required';
      if (!form.description.trim()) e.description = 'Required';
      if (!form.category) e.category = 'Required';
      if (!form.brand.trim()) e.brand = 'Required';
      if (!form.sku.trim()) e.sku = 'Required';
    }
    
    if (activeStep === 1) {
      // Validate required specifications only if category specs are loaded
      if (currentCategorySpecs && currentCategorySpecs.required && Array.isArray(currentCategorySpecs.required)) {
        currentCategorySpecs.required.forEach(field => {
          if (!form.specifications[field]) {
            e.specifications = `${field} is required for ${form.category} products`;
          }
        });
      } else if (form.category) {
        // If category is selected but specs are not loaded, allow proceeding
        // The user can fill specifications manually in JSON format
        console.log('⚠️ Category specs not loaded yet, allowing manual specification entry');
      } else {
        e.category = 'Please select a category first';
      }
    }
    
    if (activeStep === 2) {
      if (!form.price || parseFloat(form.price) <= 0) e.price = 'Enter valid price';
      if (!form.stock || parseInt(form.stock) < 0) e.stock = 'Enter valid stock';
      if (!form.weight || parseFloat(form.weight) < 0) e.weight = 'Enter valid weight';
    }
    
    if (activeStep === 3) {
      if (form.images.length + previewImages.length === 0) e.images = 'At least one image required';
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Variant helpers
  const setColors = (colors: string[]) => setForm(f => ({ ...f, colors }));
  const setSizes = (sizes: string[]) => setForm(f => ({ ...f, sizes }));
  const addVariant = (variant: { color?: string; size?: string; sku?: string; price?: number; stock: number; active?: boolean }) =>
    setForm(f => ({ ...f, variants: [...f.variants, variant] }));
  const updateVariant = (index: number, patch: Partial<{ color?: string; size?: string; sku?: string; price?: number; stock: number; active?: boolean }>) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === index ? { ...v, ...patch } : v) }));
  const removeVariant = (index: number) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  const regenerateVariants = () => {
    const colors = (form.colors || []).filter(Boolean);
    const sizes = (form.sizes || []).filter(Boolean);
    const combos: Array<{ color?: string; size?: string; sku?: string; price?: number; stock: number; active?: boolean }> = [];
    if (colors.length === 0 && sizes.length === 0) return setForm(f => ({ ...f, variants: [] }));
    if (colors.length === 0) {
      sizes.forEach(size => combos.push({ size, stock: 0, active: true }));
    } else if (sizes.length === 0) {
      colors.forEach(color => combos.push({ color, stock: 0, active: true }));
    } else {
      colors.forEach(color => sizes.forEach(size => combos.push({ color, size, stock: 0, active: true })));
    }
    // Merge existing values where possible (by color+size key)
    const byKey = (v: any) => `${v.color || ''}::${v.size || ''}`;
    const existing = new Map(form.variants.map(v => [byKey(v), v]));
    const merged = combos.map(c => {
      const prev = existing.get(byKey(c));
      return prev ? { ...c, ...prev } : c;
    });
    setForm(f => ({ ...f, variants: merged }));
  };

  // Handlers
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(s => s + 1);
      setErrors({});
    }
  };
  
  const handleBack = () => setActiveStep(s => s - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown; files?: FileList }>) => {
    const { name, value, files } = e.target;
    
    if (name === 'specifications' || name === 'category_specific') {
      // Handle JSON fields
      try {
        const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
        setForm(prev => ({
          ...prev,
          [name]: jsonValue
        }));
      } catch (error) {
        // If JSON parsing fails, store as string
        setForm(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (name === 'images' && files) {
      setForm(prev => ({ ...prev, images: Array.from(files) }));
      // Create preview URLs
      const urls = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...urls]);
    } else if (name === 'tags') {
      setForm(prev => ({ ...prev, tags: (value as string).split(',').map(tag => tag.trim()).filter(tag => tag) }));
    } else if (name?.startsWith('dimensions.')) {
      const dimension = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name!]: value }));
    }
    
    // Clear error when user starts typing
    if (name && errors[name as keyof ProductForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const name = e.target.name as keyof ProductForm;
    const value = e.target.value;
    
    if (name === 'category') {
      // Reset specifications when category changes
      setForm(f => ({ 
        ...f, 
        [name]: value,
        specifications: {},
        category_specific: {}
      }));
    } else {
    setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Separate handler for specification selects
  const handleSpecificationSelectChange = (specKey: string, value: string) => {
    setForm(f => ({ 
      ...f, 
      specifications: { ...f.specifications, [specKey]: value } 
    }));
  };

  // Separate handler for category-specific selects
  const handleCategorySpecificSelectChange = (specKey: string, value: string) => {
    setForm(f => ({ 
      ...f, 
      category_specific: { ...f.category_specific, [specKey]: value } 
    }));
  };

  const handleRemoveImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] }));
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  // Generate search keywords automatically
  const generateSearchKeywords = () => {
    const keywords = [
      form.name,
      form.brand,
      form.category,
      ...form.tags,
      ...Object.values(form.specifications),
      ...Object.values(form.category_specific)
    ].filter(Boolean).join(' ').toLowerCase();
    
    setForm(f => ({ ...f, search_keywords: keywords }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate search keywords if not provided
      if (!form.search_keywords) {
        generateSearchKeywords();
      }

      // Normalize specs according to currentCategorySpecs schema
      const normalizeValue = (val: any, fieldSpec?: any) => {
        if (!fieldSpec) return val;
        const t = fieldSpec.type;
        if (t === 'array') {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            // split comma-separated, or wrap single string
            const trimmed = val.trim();
            if (trimmed.includes(',')) {
              return trimmed.split(',').map(s => s.trim()).filter(Boolean);
            }
            return trimmed ? [trimmed] : [];
          }
          return val !== undefined && val !== null ? [val] : [];
        }
        if (t === 'number') {
          if (typeof val === 'number') return val;
          if (typeof val === 'string' && val.trim() !== '') {
            const num = Number(val);
            return isNaN(num) ? val : num;
          }
          return val;
        }
        // default: string/boolean/object passthrough
        return val;
      };

      const normalizeObject = (obj: Record<string, any>, schema?: any) => {
        if (!obj) return obj;
        const result: Record<string, any> = {};
        Object.entries(obj).forEach(([k, v]) => {
          const fieldSpec = schema?.specifications?.[k] || schema?.filters?.[k] || schema?.[k];
          result[k] = normalizeValue(v as any, fieldSpec);
        });
        return result;
      };

      const normalizedSpecifications = normalizeObject(
        form.specifications,
        currentCategorySpecs
      );
      const normalizedCategorySpecific = normalizeObject(
        form.category_specific,
        currentCategorySpecs
      );

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('brand', form.brand);
      formData.append('stock', form.stock);
      formData.append('sku', form.sku);
      formData.append('weight', form.weight);
      formData.append('dimensions', JSON.stringify(form.dimensions));
      formData.append('tags', JSON.stringify(form.tags));
      formData.append('metaTitle', form.metaTitle);
      formData.append('metaDescription', form.metaDescription);
      formData.append('specifications', JSON.stringify(normalizedSpecifications));
      formData.append('category_specific', JSON.stringify(normalizedCategorySpecific));
      formData.append('search_keywords', form.search_keywords);
      formData.append('variant_colors', JSON.stringify(form.colors || []));
      formData.append('variant_sizes', JSON.stringify(form.sizes || []));
      formData.append('variants', JSON.stringify((form.variants || []).map(v => ({
        id: v.id,
        color: v.color,
        size: v.size,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        active: v.active !== false
      }))));
      
      form.images.forEach(img => formData.append('images', img));
      
      if (editMode && id) {
        await api.put(`/api/products/${id}`, formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        setSuccess('Product updated successfully!');
      } else {
        await api.post('/api/products/', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        setSuccess('Product created successfully!');
        setForm(initialForm);
        setPreviewImages([]);
        setActiveStep(0);
      }
      
      setTimeout(() => navigate('/admin/products'), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || (editMode ? 'Failed to update product.' : 'Failed to create product.'));
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStep = () => {
    switch (activeStep) {
      case 0: // Basic Info
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Product Name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.name} 
                helperText={errors.name} 
              />
              <TextField 
                label="Description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                fullWidth 
                required 
                multiline 
                rows={3} 
                error={!!errors.description} 
                helperText={errors.description} 
                sx={{ mt: 2 }} 
              />
              <TextField 
                label="SKU" 
                name="sku" 
                value={form.sku} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.sku} 
                helperText={errors.sku} 
                sx={{ mt: 2 }} 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Brand" 
                name="brand" 
                value={form.brand} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.brand} 
                helperText={errors.brand} 
                sx={{ mb: 2 }} 
              />
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Category</InputLabel>
              <Select
                name="category"
                  value={form.category}
                  label="Category"
                onChange={handleSelectChange}
              >
                <MenuItem value=""><em>Select Category</em></MenuItem>
                  {Array.isArray(categorySpecs) && categorySpecs.length > 0 ? (
                    categorySpecs.map(spec => (
                      <MenuItem key={spec.category} value={spec.category}>
                        {spec.name}
                      </MenuItem>
                    ))
                  ) : (
                    // Fallback categories if API data is not available
                    [
                      { category: 'laptop', name: 'Laptops' },
                      { category: 'mobile', name: 'Mobile Phones' },
                      { category: 'fridge', name: 'Refrigerators' },
                      { category: 'fan', name: 'Fans' },
                      { category: 'clothing', name: 'Clothing' }
                    ].map(spec => (
                      <MenuItem key={spec.category} value={spec.category}>
                        {spec.name}
                      </MenuItem>
                    ))
                  )}
              </Select>
                {errors.category && (
                  <Typography color="error" variant="caption">
                    {errors.category}
                  </Typography>
                )}
                {!Array.isArray(categorySpecs) || categorySpecs.length === 0 ? (
                  <Typography color="text.secondary" variant="caption">
                    Using fallback categories (API data not available)
                  </Typography>
                ) : null}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1: // Category & Specifications
        return (
          <Box>
            {/* Show selected category */}
            {form.category && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Selected Category: <strong>{form.category}</strong>
                </Typography>
              </Alert>
            )}

            {currentCategorySpecs && (currentCategorySpecs.name || currentCategorySpecs.category) ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {currentCategorySpecs.name || currentCategorySpecs.category} Specifications
                </Typography>
                
                {/* Required Specifications */}
                {currentCategorySpecs.required && currentCategorySpecs.required.length > 0 && (
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Required Specifications</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Array.isArray(currentCategorySpecs.required) && currentCategorySpecs.required.map(field => {
                          const fieldSpec = currentCategorySpecs.specifications?.[field];
                          return (
                            <Grid item xs={12} md={6} key={field}>
                              <TextField
                                label={`${field.replace(/_/g, ' ').toUpperCase()}${fieldSpec?.unit ? ` (${fieldSpec.unit})` : ''}`}
                                name={`specifications.${field}`}
                                value={form.specifications[field] || ''}
                                onChange={e => handleSpecificationSelectChange(field, e.target.value as string)}
                                fullWidth
                                required
                                type={fieldSpec?.type === 'number' ? 'number' : 'text'}
                                error={!!errors.specifications}
                                helperText={errors.specifications}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Optional Specifications */}
                {currentCategorySpecs.optional && currentCategorySpecs.optional.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Optional Specifications</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Array.isArray(currentCategorySpecs.optional) && currentCategorySpecs.optional.map(field => {
                          const fieldSpec = currentCategorySpecs.specifications?.[field];
                          return (
                            <Grid item xs={12} md={6} key={field}>
                              <TextField
                                label={`${field.replace(/_/g, ' ').toUpperCase()}${fieldSpec?.unit ? ` (${fieldSpec.unit})` : ''}`}
                                name={`specifications.${field}`}
                                value={form.specifications[field] || ''}
                                onChange={e => handleSpecificationSelectChange(field, e.target.value as string)}
                                fullWidth
                                type={fieldSpec?.type === 'number' ? 'number' : 'text'}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Category-Specific Fields */}
                {currentCategorySpecs.filters && Object.keys(currentCategorySpecs.filters).length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Category-Specific Attributes</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Object.entries(currentCategorySpecs.filters).map(([key, options]) => (
                          <Grid item xs={12} md={6} key={key}>
                            <FormControl fullWidth>
                              <InputLabel>{key.replace(/_/g, ' ').toUpperCase()}</InputLabel>
                              <Select
                                name={`category_specific.${key}`}
                                value={form.category_specific[key] || ''}
                                label={key.replace(/_/g, ' ').toUpperCase()}
                                onChange={(e) => handleCategorySpecificSelectChange(key, e.target.value)}
                              >
                                <MenuItem value=""><em>Select {key.replace(/_/g, ' ')}</em></MenuItem>
                                {Array.isArray(options) && options.map((option: any) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}
              </>
            ) : (
              // Fallback content when category specs are not loaded
              <Box>
                {form.category ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      Loading specifications for category: <strong>{form.category}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Please wait while we load the category specifications...
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2">Loading...</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={() => {
                        console.log('🔄 Manually refreshing category specs for:', form.category);
                        dispatch(getCategorySpecs(form.category));
                      }}
                    >
                      Refresh Specifications
                    </Button>
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      No category selected
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Please go back to step 1 and select a category first.
                    </Typography>
                  </Alert>
                )}
                
                {/* Show basic specifications as fallback */}
                <Typography variant="h6" gutterBottom>
                  Basic Specifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You can manually enter specifications in JSON format below, or wait for the category specifications to load.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Specifications (JSON format)"
                      name="specifications"
                      value={JSON.stringify(form.specifications, null, 2)}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder='{"processor": "Intel i5", "ram_size": 8, "storage_type": "SSD"}'
                      helperText="Enter specifications in JSON format"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Category Specific (JSON format)"
                      name="category_specific"
                      value={JSON.stringify(form.category_specific, null, 2)}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder='{"color": "Black", "brand": "HP"}'
                      helperText="Enter category-specific attributes in JSON format"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        );

      case 2: // Pricing & Inventory
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField 
                label="Price" 
                name="price" 
                value={form.price} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.price} 
                helperText={errors.price} 
                InputProps={{ 
                  startAdornment: <InputAdornment position="start">₹</InputAdornment> 
                }} 
                type="number" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField 
                label="Stock" 
                name="stock" 
                value={form.stock} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.stock} 
                helperText={errors.stock} 
                type="number" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField 
                label="Weight (kg)" 
                name="weight" 
                value={form.weight} 
                onChange={handleChange} 
                fullWidth 
                required 
                error={!!errors.weight} 
                helperText={errors.weight} 
                type="number" 
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Dimensions (cm)</Typography>
              <Stack direction="row" spacing={2}>
                <TextField 
                  label="Length" 
                  name="dimensions.length" 
                  value={form.dimensions.length} 
                  onChange={handleChange} 
                  type="number" 
                />
                <TextField 
                  label="Width" 
                  name="dimensions.width" 
                  value={form.dimensions.width} 
                  onChange={handleChange} 
                  type="number" 
                />
                <TextField 
                  label="Height" 
                  name="dimensions.height" 
                  value={form.dimensions.height} 
                  onChange={handleChange} 
                  type="number" 
                />
              </Stack>
            </Grid>
            {/* Variants management */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Variants (Colors / Sizes)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[
                      'Red','Blue','Green','Black','White','Silver','Gold','Gray','Pink','Purple'
                    ]}
                    value={form.colors}
                    onChange={(_, value) => setColors(value)}
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Colors" placeholder="Add color" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[
                      'XS','S','M','L','XL','XXL'
                    ]}
                    value={form.sizes}
                    onChange={(_, value) => setSizes(value)}
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Sizes" placeholder="Add size" />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={regenerateVariants} startIcon={<AddIcon />}>Generate Variants</Button>
                    <Typography variant="body2" color="text.secondary">This will create rows for all combinations.</Typography>
                  </Stack>
                </Grid>
                {form.variants.length > 0 && (
                  <Grid item xs={12}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Color</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Price (override)</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Active</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {form.variants.map((v, i) => (
                          <TableRow key={`${v.color || ''}-${v.size || ''}-${i}`}>
                            <TableCell sx={{ minWidth: 120 }}>
                              <TextField size="small" value={v.color || ''} onChange={(e) => updateVariant(i, { color: e.target.value })} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 120 }}>
                              <TextField size="small" value={v.size || ''} onChange={(e) => updateVariant(i, { size: e.target.value })} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 140 }}>
                              <TextField size="small" value={v.sku || ''} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 140 }}>
                              <TextField size="small" type="number" value={v.price ?? ''} onChange={(e) => updateVariant(i, { price: e.target.value === '' ? undefined : Number(e.target.value) })} />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 120 }}>
                              <TextField size="small" type="number" value={v.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) || 0 })} />
                            </TableCell>
                            <TableCell>
                              <FormControlLabel control={<Switch checked={v.active !== false} onChange={(e) => updateVariant(i, { active: e.target.checked })} />} label="" />
                            </TableCell>
                            <TableCell>
                              <IconButton color="error" onClick={() => removeVariant(i)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        );

      case 3: // Images
        return (
          <Box>
            <Button variant="outlined" component="label">
              Upload Images
              <input type="file" name="images" multiple accept="image/*" hidden onChange={handleChange} />
            </Button>
            {errors.images && <Typography color="error" variant="caption">{errors.images}</Typography>}
            <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }}>
              {previewImages.map((img, idx) => (
                <Box key={idx} sx={{ width: 100, height: 100, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton size="small" color="error" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'white' }} onClick={() => handleRemoveImage(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Box>
        );

      case 4: // SEO & Tags
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Meta Title" 
                name="metaTitle" 
                value={form.metaTitle} 
                onChange={handleChange} 
                fullWidth 
              />
              <TextField 
                label="Meta Description" 
                name="metaDescription" 
                value={form.metaDescription} 
                onChange={handleChange} 
                fullWidth 
                multiline 
                rows={2} 
                sx={{ mt: 2 }} 
              />
              <TextField 
                label="Search Keywords" 
                name="search_keywords" 
                value={form.search_keywords} 
                onChange={handleChange} 
                fullWidth 
                multiline 
                rows={2} 
                sx={{ mt: 2 }} 
                helperText="Keywords for better search results (auto-generated if empty)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Tags</Typography>
              <Stack direction="row" spacing={1}>
                <TextField 
                  size="small" 
                  placeholder="Add tag..." 
                  value={newTag} 
                  onChange={e => setNewTag(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} 
                />
                <Button variant="outlined" onClick={handleAddTag} disabled={!newTag.trim()}>
                  Add
                </Button>
              </Stack>
              <Box sx={{ mt: 1 }}>
                {form.tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} sx={{ m: 0.5 }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      case 5: // Summary
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Product Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography><b>Name:</b> {form.name}</Typography>
                <Typography><b>Description:</b> {form.description}</Typography>
                <Typography><b>Category:</b> {form.category}</Typography>
                <Typography><b>Brand:</b> {form.brand}</Typography>
                <Typography><b>SKU:</b> {form.sku}</Typography>
                <Typography><b>Price:</b> ₹{form.price}</Typography>
                <Typography><b>Stock:</b> {form.stock}</Typography>
                <Typography><b>Weight:</b> {form.weight} kg</Typography>
                <Typography><b>Dimensions:</b> {form.dimensions.length} x {form.dimensions.width} x {form.dimensions.height} cm</Typography>
                
                {/* Specifications Summary */}
                {Object.keys(form.specifications).length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 2 }}><b>Specifications:</b></Typography>
                    {Object.entries(form.specifications).map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        {key.replace(/_/g, ' ').toUpperCase()}: {value}
                      </Typography>
                    ))}
                  </>
                )}
                
                <Typography><b>Meta Title:</b> {form.metaTitle}</Typography>
                <Typography><b>Meta Description:</b> {form.metaDescription}</Typography>
                <Typography><b>Search Keywords:</b> {form.search_keywords}</Typography>
                <Typography><b>Tags:</b> {form.tags.length > 0 ? form.tags.join(', ') : 'None'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><b>Images:</b></Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {previewImages.map((img, idx) => (
                    <Box key={idx} sx={{ width: 100, height: 100, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden', position: 'relative', mb: 1 }}>
                      <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <IconButton size="small" color="error" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'white' }} onClick={() => handleRemoveImage(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box maxWidth="1200px" mx="auto" mt={4}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {editMode ? 'Edit Product' : 'Create Product'}
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <form onSubmit={handleSubmit} autoComplete="off">
          {renderStep()}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button 
              disabled={activeStep === 0 || loading} 
              onClick={handleBack} 
              type="button"
              startIcon={<CancelIcon />}
            >
              Back
            </Button>
            
            {activeStep < steps.length - 1 && (
              <Button 
                variant="contained" 
                onClick={handleNext} 
                type="button" 
                disabled={loading}
                endIcon={<AddIcon />}
              >
                Next
              </Button>
            )}
            
            {activeStep === steps.length - 1 && (
              <Button 
                variant="contained" 
                type="submit" 
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {loading ? <CircularProgress size={20} /> : (editMode ? 'Update Product' : 'Create Product')}
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminProductForm; 