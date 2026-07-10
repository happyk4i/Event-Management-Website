import React, { useState, useEffect, Suspense } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Database, 
  Sparkles, 
  Calendar, 
  MapPin,
  Users,
  AlertCircle, 
  X, 
  Check, 
  Loader2, 
  RefreshCw,
  Tag,
  DollarSign,
  Ticket,
  Grid,
  List,
  Flame,
  Info,
  TrendingUp,
  SlidersHorizontal,
  Bookmark,
  CalendarDays,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Laptop,
  Palette,
  Coffee,
  Trophy,
  BookOpen,
  Layers,
  Music,
  User,
  LogOut,
  Gift,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  BarChart3,
  CalendarCheck,
  Zap,
  Crown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Event, CATEGORIES, STATUSES, User as UserType, Transaction, Review, Coupon, PointRecord } from './types.js';

// Lazy load 3D Scene
const Scene3D = React.lazy(() => import('./Scene3D.js'));

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('ephemeral_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userProfile, setUserProfile] = useState<{pointRecords: PointRecord[]; coupons: Coupon[]} | null>(null);

  // Core Event Lists & Pagination States
  const [events, setEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Layout View Mode State (grid or list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Active View Tab ('explore' | 'dashboard')
  const [activeTab, setActiveTab] = useState<'explore' | 'dashboard'>('explore');

  // Auth Card Modals / Views
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authRole, setAuthRole] = useState<'Customer' | 'Organizer'>('Customer');
  const [authReferredBy, setAuthReferredBy] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Event Creation & Update Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Event Details Modal & Checkout
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventReviews, setSelectedEventReviews] = useState<Review[]>([]);
  const [reviewsStats, setReviewsStats] = useState<{ totalReviews: number; averageRating: number }>({ totalReviews: 0, averageRating: 0 });
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(false);

  // Ticket checkout settings
  const [applyCouponId, setApplyCouponId] = useState<string>('');
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [pointsToUseInput, setPointsToUseInput] = useState<number>(0);

  // Event Feedback State
  const [userRating, setUserRating] = useState<number>(5);
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Form Fields State for Event Creator
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>(CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCapacity, setFormCapacity] = useState<number>(100);
  const [formAvailableSeats, setFormAvailableSeats] = useState<number>(100);
  const [formDate, setFormDate] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('19:00');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>(STATUSES[0]);
  const [formError, setFormError] = useState<string | null>(null);

  // Transaction Lists & Stats
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsRange, setStatsRange] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);

  // Interactive UI indicators
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Interactive hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 1. Debounce Search Bar Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset page on new search
    }, 4500); // 450ms debounce
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 2. Fetch Events when filters, search queries, or page changes
  useEffect(() => {
    fetchEvents();
  }, [debouncedSearchQuery, selectedCategory, selectedStatus, selectedLocation, currentPage]);

  // 3. Fetch User profile metrics if logged in
  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
      fetchMyTransactions();
      if (currentUser.role === 'Organizer') {
        fetchDashboardStats();
      }
    } else {
      setUserProfile(null);
      setMyTransactions([]);
    }
  }, [currentUser]);

  // Fetch Events from backend with custom parameters
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedLocation) params.append('location', selectedLocation);
      params.append('page', String(currentPage));
      params.append('limit', '6');

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Could not retrieve active events from the server database.');
      }
      const data = await response.json();
      setEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred connecting to the server database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile points & coupons
  const fetchUserProfile = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/auth/profile/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile({
          pointRecords: data.pointRecords || [],
          coupons: data.coupons || []
        });
        // Sync points count
        if (data.user && data.user.pointsBalance !== currentUser.pointsBalance) {
          const updatedUser = { ...currentUser, pointsBalance: data.user.pointsBalance };
          setCurrentUser(updatedUser);
          localStorage.setItem('ephemeral_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  // Fetch transactions of currently logged in buyer
  const fetchMyTransactions = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/transactions?buyerId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setMyTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch organizer statistics for chart dashboard
  const fetchDashboardStats = async () => {
    if (!currentUser || currentUser.role !== 'Organizer') return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/transactions/organizer/stats');
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load reviews for the selected event details
  const fetchEventReviews = async (eventId: string) => {
    setIsReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews/event/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEventReviews(data.reviews || []);
        setReviewsStats(data.stats || { totalReviews: 0, averageRating: 0 });
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  // Display floating notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Seed Event Records Helper
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/events/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Event list initialized successfully!');
        fetchEvents();
      } else {
        showToast(data.error || 'The catalog is already seeded with events.', 'error');
      }
    } catch (err) {
      showToast('Connection to server failed while seeding.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Perform Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authName || !authEmail || !authPassword) {
      setAuthError('Name, Email, and Password are required to sign up.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole,
          referredBy: authReferredBy
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      showToast('Registration complete! Welcome to Ephemeral Platform.');
      // Auto-login
      setCurrentUser(data.user);
      localStorage.setItem('ephemeral_user', JSON.stringify(data.user));
      setIsAuthOpen(false);
      resetAuthFields();
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  // Perform Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail || !authPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      setCurrentUser(data.user);
      localStorage.setItem('ephemeral_user', JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.name}!`);
      setIsAuthOpen(false);
      resetAuthFields();
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  // Logout session
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ephemeral_user');
    showToast('Successfully logged out.');
    setActiveTab('explore');
  };

  const resetAuthFields = () => {
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthRole('Customer');
    setAuthReferredBy('');
    setAuthError(null);
  };

  // View Details Model Loader
  const handleOpenDetails = (event: Event) => {
    setSelectedEvent(event);
    setApplyCouponId('');
    setRedeemPoints(false);
    setPointsToUseInput(0);
    setUserFeedback('');
    setFeedbackError(null);
    setIsDetailsOpen(true);
    fetchEventReviews(event.id);
  };

  // Check out Purchase Ticket
  const handleBookTicket = async () => {
    if (!currentUser) {
      setIsDetailsOpen(false);
      setAuthMode('login');
      setIsAuthOpen(true);
      showToast('Please register or log in to buy event tickets.', 'error');
      return;
    }

    if (!selectedEvent) return;
    if (selectedEvent.availableSeats <= 0) {
      showToast('This event is fully booked! Tickets are sold out.', 'error');
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          buyerId: currentUser.id,
          useCouponId: applyCouponId || null,
          usePointsAmount: redeemPoints ? pointsToUseInput : 0
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transaction failed.');
      }

      showToast(`Booking Confirmed! Seat secured for "${selectedEvent.name}".`);
      setIsDetailsOpen(false);
      
      // Update local catalogs
      fetchEvents();
      fetchUserProfile();
      fetchMyTransactions();
    } catch (error: any) {
      showToast(error.message || 'Error occurred while booking ticket.', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  // Submit Feedback Review
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    if (!currentUser) return;
    if (!selectedEvent) return;

    if (!userFeedback.trim()) {
      setFeedbackError('Please enter a short review message.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          userId: currentUser.id,
          userName: currentUser.name,
          rating: userRating,
          feedback: userFeedback.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not post feedback.');
      }

      showToast('Thank you! Your feedback review has been registered.');
      setUserFeedback('');
      fetchEventReviews(selectedEvent.id);
    } catch (error: any) {
      setFeedbackError(error.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Open Event Creation Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingEventId(null);
    setFormName('');
    setFormDescription('');
    setFormCode('');
    setFormCategory(CATEGORIES[0]);
    setFormPrice(0);
    setFormCapacity(200);
    setFormAvailableSeats(200);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setFormDate(tomorrow.toISOString().split('T')[0]);
    setFormTime('19:00');
    setFormLocation('');
    setFormStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card details click
    setModalMode('edit');
    setEditingEventId(event.id);
    setFormName(event.name);
    setFormDescription(event.description || '');
    setFormCode(event.code);
    setFormCategory(event.category);
    setFormPrice(event.price);
    setFormCapacity(event.capacity);
    setFormAvailableSeats(event.availableSeats);
    setFormDate(event.date);
    setFormTime(event.time || '19:00');
    setFormLocation(event.location);
    setFormStatus(event.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Listing Event
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form validation
    if (!formName.trim()) {
      setFormError('Please enter a descriptive Event Name.');
      return;
    }
    if (!formCode.trim()) {
      setFormError('A unique event registry SKU code is required.');
      return;
    }
    if (!formDate) {
      setFormError('An event schedule date is required.');
      return;
    }
    if (!formLocation.trim()) {
      setFormError('Please provide a specific location or venue address.');
      return;
    }
    if (formPrice < 0) {
      setFormError('Price cannot be a negative amount.');
      return;
    }
    if (formCapacity <= 0) {
      setFormError('Total Capacity must be a positive integer.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      code: formCode.trim().toUpperCase(),
      category: formCategory,
      price: Number(formPrice),
      capacity: Number(formCapacity),
      availableSeats: Number(formAvailableSeats) > Number(formCapacity) ? Number(formCapacity) : Number(formAvailableSeats),
      date: formDate,
      time: formTime,
      location: formLocation.trim(),
      status: Number(formAvailableSeats) === 0 ? 'Sold Out' : formStatus,
      organizerId: currentUser ? currentUser.id : null
    };

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to list new event.');
        }
        showToast(`Success: listed event "${payload.name}"!`);
        setIsModalOpen(false);
        fetchEvents();
        if (currentUser?.role === 'Organizer') {
          fetchDashboardStats();
        }
      } else {
        const res = await fetch(`/api/events/${editingEventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update event details.');
        }
        showToast(`Success: updated details for "${payload.name}"!`);
        setIsModalOpen(false);
        fetchEvents();
        if (currentUser?.role === 'Organizer') {
          fetchDashboardStats();
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete event listing helper
  const handleDeleteEvent = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid card click
    if (!window.confirm(`Are you sure you want to permanently cancel and remove the event listing: "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Event "${name}" has been removed from the registry.`);
        fetchEvents();
        if (currentUser?.role === 'Organizer') {
          fetchDashboardStats();
        }
      } else {
        showToast(data.error || 'Failed to delete the event.', 'error');
      }
    } catch (err) {
      showToast('Connection to API server failed.', 'error');
    }
  };

  // Event SKU code generator
  const handleAutoGenerateCode = () => {
    if (!formName) {
      setFormError('Type an Event Title first to generate a structured SKU code.');
      return;
    }
    
    const cleanWords = formName
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .split(' ')
      .filter(Boolean);
    
    let prefix = 'EV';
    if (cleanWords.length >= 2) {
      prefix = cleanWords.slice(0, 3).map((w: string | any[]) => w.slice(0, 2)).join('');
    } else if (cleanWords.length === 1) {
      prefix = cleanWords[0].slice(0, 4);
    }
    
    const yearPart = formDate ? formDate.split('-')[0] : new Date().getFullYear();
    const randCode = Math.floor(100 + Math.random() * 900);
    setFormCode(`${prefix}-${yearPart}-${randCode}`);
  };

  // Map category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Music': return <Music className="h-4 w-4" />;
      case 'Technology': return <Laptop className="h-4 w-4" />;
      case 'Arts & Crafts': return <Palette className="h-4 w-4" />;
      case 'Food & Culinary': return <Coffee className="h-4 w-4" />;
      case 'Workshop': return <BookOpen className="h-4 w-4" />;
      case 'Sports': return <Trophy className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  // Map category color schemes — NEO-BRUTALISM STYLE
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Music': return 'bg-[#B388FF] text-[#1a1a2e] border-[#1a1a2e]';
      case 'Technology': return 'bg-[#00D4FF] text-[#1a1a2e] border-[#1a1a2e]';
      case 'Arts & Crafts': return 'bg-[#FF6B9D] text-[#1a1a2e] border-[#1a1a2e]';
      case 'Food & Culinary': return 'bg-[#FFD700] text-[#1a1a2e] border-[#1a1a2e]';
      case 'Workshop': return 'bg-[#7CFC00] text-[#1a1a2e] border-[#1a1a2e]';
      case 'Sports': return 'bg-[#FF8C42] text-[#1a1a2e] border-[#1a1a2e]';
      default: return 'bg-white text-[#1a1a2e] border-[#1a1a2e]';
    }
  };

  // Card accent colors for visual variety
  const getCardAccent = (index: number) => {
    const accents = ['#FFD700', '#FF6B9D', '#00D4FF', '#7CFC00', '#B388FF', '#FF8C42'];
    return accents[index % accents.length];
  };

  // Indonesian Rupiah currency formatter (IDR)
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Verification if buyer has purchased ticket to display review box
  const hasPurchasedSelectedEvent = () => {
    if (!currentUser) return false;
    if (!selectedEvent) return false;
    return myTransactions.some((t: { eventId: any; }) => t.eventId === selectedEvent.id);
  };

  // Warn user of expiring points/coupons (3 months validation)
  const renderExpirationsWarning = () => {
    if (!userProfile) return null;
    const today = new Date();
    
    // Check points records that will expire within the next 30 days
    const closeToExpirePoints = userProfile.pointRecords.filter((r: { isUsed: any; expiryDate: string | number | Date; }) => {
      if (r.isUsed) return false;
      const expDate = new Date(r.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    });

    // Check coupons that will expire within the next 30 days
    const closeToExpireCoupons = userProfile.coupons.filter((c: { isUsed: any; expiryDate: string | number | Date; }) => {
      if (c.isUsed) return false;
      const expDate = new Date(c.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    });

    if (closeToExpirePoints.length === 0 && closeToExpireCoupons.length === 0) return null;

    return (
      <div className="bg-[#FFD700] nb-border p-4 mb-4 text-xs text-[#1a1a2e] flex items-start space-x-3 nb-shadow-sm animate-shake-hover">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-black uppercase tracking-wider text-[11px]">⚡ EXPIRATION ALERT!</p>
          {closeToExpirePoints.map((p: { id: any; amount: number; expiryDate: any; }) => (
            <p key={p.id}>• {formatRupiah(p.amount)} referral reward points expire on <strong>{p.expiryDate}</strong></p>
          ))}
          {closeToExpireCoupons.map((c: { id: any; code: any; expiryDate: any; }) => (
            <p key={c.id}>• 10% welcome coupon [<strong>{c.code}</strong>] expires on <strong>{c.expiryDate}</strong></p>
          ))}
        </div>
      </div>
    );
  };

  // Calculations for checkout summary
  const getCheckoutPricing = () => {
    if (!selectedEvent) return { originalPrice: 0, earlyBird: 0, coupon: 0, points: 0, finalPrice: 0 };
    let orig = selectedEvent.price;
    
    // Date-based 5% early bird discount (if scheduled date > 30 days out)
    let earlyBird = 0;
    const daysOut = (new Date(selectedEvent.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysOut > 30 && orig > 0) {
      earlyBird = orig * 0.05;
    }

    // Selected coupon deduction (10% on remaining)
    let couponDeduction = 0;
    if (applyCouponId && userProfile) {
      const matchedCoupon = userProfile.coupons.find((c: { id: any; }) => c.id === applyCouponId);
      if (matchedCoupon) {
        couponDeduction = (orig - earlyBird) * matchedCoupon.discount;
      }
    }

    // Points deduction (1 point = 1 IDR)
    let maxPointsAllowed = Math.max(0, orig - earlyBird - couponDeduction);
    let ptsUsed = 0;
    if (redeemPoints && currentUser) {
      ptsUsed = Math.min(pointsToUseInput, currentUser.pointsBalance, maxPointsAllowed);
    }

    return {
      originalPrice: orig,
      earlyBird,
      coupon: couponDeduction,
      points: ptsUsed,
      finalPrice: Math.max(0, orig - earlyBird - couponDeduction - ptsUsed)
    };
  };

  const checkoutPricing = getCheckoutPricing();

  // ===================================================================
  // NEO-BRUTALISM RENDER
  // ===================================================================
  return (
    <div className="min-h-screen bg-[#FFFEF9] dot-grid-bg text-[#1a1a2e] flex flex-col font-sans selection:bg-[#FFD700]/40" id="app-root-container">
      
      {/* =================== TOAST NOTIFICATION =================== */}
      {toast && (
        <div 
          className={`fixed top-6 right-6 z-[100] flex items-center space-x-3 px-5 py-4 nb-border animate-bounce-in ${
            toast.type === 'success' 
              ? 'bg-[#7CFC00] nb-shadow' 
              : 'bg-[#FF4757] text-white nb-shadow'
          }`}
          id="toast-alert"
        >
          <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-[#1a1a2e] text-[#7CFC00]' : 'bg-white text-[#FF4757]'}`}>
            {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.type === 'success' ? '✅ SUCCESS!' : '❌ ERROR!'}</span>
            <span className="text-sm font-bold mt-0.5">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="ml-2 hover:rotate-90 transition-transform">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =================== MARQUEE TOP BANNER =================== */}
      <div className="bg-[#1a1a2e] text-[#FFD700] py-2.5 overflow-hidden border-b-4 border-[#FFD700]">
        <div className="animate-marquee whitespace-nowrap flex items-center space-x-8 text-xs font-black uppercase tracking-widest">
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="flex items-center space-x-2"><Zap className="h-3.5 w-3.5" /><span>Indonesian Premium Event Platform</span></span>
              <span>★</span>
              <span className="flex items-center space-x-2"><Ticket className="h-3.5 w-3.5" /><span>Secure Ticketing System</span></span>
              <span>★</span>
              <span className="flex items-center space-x-2"><Crown className="h-3.5 w-3.5" /><span>Referral Rewards Active</span></span>
              <span>★</span>
              <span className="flex items-center space-x-2"><Sparkles className="h-3.5 w-3.5" /><span>Neo-Brutal Experience</span></span>
              <span>★</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* =================== NAVIGATION HEADER =================== */}
      <nav className="bg-white nb-border border-t-0 sticky top-0 z-40 px-6 py-4" id="main-navigation">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo — Neo-Brutalist */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('explore')}>
            <div className="h-12 w-12 bg-[#FFD700] text-[#1a1a2e] flex items-center justify-center nb-border nb-shadow-sm group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tight text-[#1a1a2e] animate-glitch">EVENT KUY</h1>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B9D]">Neo-Brutal Event Hub 🔥</p>
            </div>
          </div>

          {/* Center Tabs */}
          {currentUser && (
            <div className="flex items-center nb-border bg-[#FFFEF9] p-1">
              <button 
                onClick={() => setActiveTab('explore')}
                className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'explore' 
                    ? 'bg-[#FFD700] text-[#1a1a2e] nb-shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                ⚡ Explore
              </button>
              {currentUser.role === 'Organizer' && (
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-[#00D4FF] text-[#1a1a2e] nb-shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  📊 Dashboard
                </button>
              )}
            </div>
          )}

          {/* User Session */}
          <div className="flex items-center space-x-3">
            {!currentUser ? (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                className="nb-btn px-5 py-2.5 bg-[#FF6B9D] text-[#1a1a2e] text-xs flex items-center space-x-2"
                id="login-trigger-btn"
              >
                <User className="h-4 w-4" />
                <span>Sign In / Register</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-[#1a1a2e]">{currentUser.name}</p>
                  <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 inline-block ${
                    currentUser.role === 'Organizer' ? 'bg-[#00D4FF]' : 'bg-[#7CFC00]'
                  } border-2 border-[#1a1a2e]`}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="nb-btn p-2.5 bg-white text-[#1a1a2e]"
                  title="Sign Out Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* =================== HERO SECTION WITH 3D =================== */}
      {activeTab === 'explore' && (
        <div className="relative overflow-hidden bg-[#1a1a2e] border-b-4 border-[#FFD700]" style={{ minHeight: '340px' }}>
          {/* 3D Canvas Background */}
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
          
          {/* Hero Content Overlay */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center text-center">
            <div className="animate-slide-up">
              <span className="inline-block bg-[#FFD700] text-[#1a1a2e] nb-border px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6 nb-shadow-sm rotate-[-1deg]">
                🎫 Platform Event #1 Indonesia
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                Discover <span className="text-[#FFD700] animate-glitch">Epic Events</span>
                <br />
                <span className="text-[#FF6B9D]">Near You</span> 🔥
              </h2>
              <p className="mt-4 text-base text-gray-300 max-w-xl mx-auto font-medium">
                Temukan event musik, tech, food, workshop terbaik di Indonesia. 
                Book tiket, dapatkan diskon, dan nikmati pengalaman yang unforgettable!
              </p>
            </div>
            
            {/* Floating stat pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-[#FFD700] nb-border px-4 py-2 text-[#1a1a2e] text-sm font-black flex items-center space-x-2 nb-shadow-sm animate-float">
                <Flame className="h-4 w-4" />
                <span>{totalCount} Events Live</span>
              </div>
              <div className="bg-[#FF6B9D] nb-border px-4 py-2 text-[#1a1a2e] text-sm font-black flex items-center space-x-2 nb-shadow-sm animate-float" style={{ animationDelay: '0.5s' }}>
                <Users className="h-4 w-4" />
                <span>Trusted Platform</span>
              </div>
              <div className="bg-[#00D4FF] nb-border px-4 py-2 text-[#1a1a2e] text-sm font-black flex items-center space-x-2 nb-shadow-sm animate-float" style={{ animationDelay: '1s' }}>
                <Gift className="h-4 w-4" />
                <span>Referral Rewards</span>
              </div>
            </div>
          </div>

          {/* Decorative geometric shapes */}
          <div className="absolute top-8 left-8 w-16 h-16 bg-[#FF6B9D] nb-border rotate-12 opacity-30 animate-float hidden lg:block" />
          <div className="absolute bottom-12 right-12 w-12 h-12 bg-[#7CFC00] nb-border rotate-45 opacity-30 animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-4 w-8 h-8 bg-[#00D4FF] nb-border rounded-full opacity-20 animate-float hidden lg:block" style={{ animationDelay: '0.5s' }} />
        </div>
      )}

      {/* Expirations Warning */}
      {currentUser && (
        <div className="max-w-7xl mx-auto w-full px-6 mt-6">
          {renderExpirationsWarning()}
        </div>
      )}

      {/* =================== MAIN CONTAINER =================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* =================== VIEW 1: EXPLORE CATALOG =================== */}
        {activeTab === 'explore' && (
          <div className="space-y-8" id="explore-panel">
            
            {/* Customer Points & Voucher widget */}
            {currentUser && currentUser.role === 'Customer' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Referral Code */}
                <div className="bg-[#B388FF] nb-border p-5 nb-shadow nb-card-hover">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] block mb-2">🎯 Your Referral Code</span>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-mono font-black text-[#1a1a2e] tracking-wider bg-white nb-border px-3 py-1.5">{currentUser.referralCode}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser.referralCode);
                        showToast('Referral code copied to clipboard!');
                      }}
                      className="nb-btn text-[10px] px-3 py-1 bg-white"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-[#1a1a2e]/70 mt-2 font-semibold">Share & earn IDR 10,000 per signup!</p>
                </div>

                {/* Points Balance */}
                <div className="bg-[#FFD700] nb-border p-5 nb-shadow nb-card-hover">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] block mb-2">💰 Points Balance</span>
                  <div className="flex items-center space-x-2">
                    <Gift className="h-5 w-5" />
                    <h4 className="text-xl font-black text-[#1a1a2e]">{formatRupiah(currentUser.pointsBalance)}</h4>
                  </div>
                  <p className="text-[10px] text-[#1a1a2e]/70 mt-2 font-semibold">Points expire 3 months after creation</p>
                </div>

                {/* Active Coupons */}
                <div className="bg-[#7CFC00] nb-border p-5 nb-shadow nb-card-hover">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] block mb-2">🎟️ Active Coupons</span>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span className="text-sm font-black text-[#1a1a2e]">
                      {userProfile?.coupons && userProfile.coupons.length > 0 
                        ? `${userProfile.coupons.length} Coupon(s) (10% OFF)`
                        : 'No coupons available'
                      }
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1a1a2e]/70 mt-2 font-semibold">Apply at checkout for extra 10% off</p>
                </div>
              </div>
            )}

            {/* Filter, Search & Location */}
            <div className="bg-white nb-border p-5 nb-shadow space-y-4" id="filters-container">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="🔍 Search events by title, SKU, or description..."
                    value={searchQuery}
                    onChange={(e: { target: { value: any; }; }) => setSearchQuery(e.target.value)}
                    className="nb-input w-full pl-10 pr-12"
                    id="search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDebouncedSearchQuery('');
                      }}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 bg-[#FF4757] text-white nb-border border-2 px-2 py-0.5 text-[10px] font-black uppercase hover:bg-[#FF6B9D] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] whitespace-nowrap">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e: { target: { value: any; }; }) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="nb-select"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] whitespace-nowrap">City:</span>
                  <input
                    type="text"
                    placeholder="e.g. Jakarta"
                    value={selectedLocation}
                    onChange={(e: { target: { value: any; }; }) => {
                      setSelectedLocation(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="nb-input max-w-[140px]"
                  />
                </div>

                {/* Status Filter (Organizer only) */}
                {currentUser?.role === 'Organizer' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] whitespace-nowrap">Status:</span>
                    <select
                      value={selectedStatus}
                      onChange={(e: { target: { value: any; }; }) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="nb-select"
                    >
                      <option value="All">All Status</option>
                      {STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center nb-border bg-[#FFFEF9] p-1 self-start lg:self-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#FFD700] text-[#1a1a2e] nb-shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                    title="Grid layout"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-all ${viewMode === 'list' ? 'bg-[#00D4FF] text-[#1a1a2e] nb-shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                    title="List layout"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Debounce Indicator */}
              {searchQuery !== debouncedSearchQuery && (
                <div className="text-[11px] font-mono font-bold text-[#FF6B9D] animate-pulse flex items-center space-x-2 pt-1">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>⏳ Debouncing search query...</span>
                </div>
              )}
            </div>

            {/* =================== EVENT CARDS =================== */}
            {isLoading ? (
              <div className="bg-white nb-border py-28 text-center flex flex-col items-center justify-center space-y-4 nb-shadow">
                <div className="h-16 w-16 bg-[#FFD700] nb-border flex items-center justify-center animate-spin rounded-full">
                  <Loader2 className="h-8 w-8 text-[#1a1a2e]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-widest font-black text-[#1a1a2e]">Loading Events...</p>
                  <p className="text-xs text-gray-500 font-medium">Fetching data from the ledger 📡</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-16 text-center bg-[#FF4757] nb-border p-6 flex flex-col items-center justify-center nb-shadow text-white">
                <ShieldAlert className="h-14 w-14 mb-3" />
                <h3 className="text-sm font-black uppercase tracking-widest">DATABASE ERROR!</h3>
                <p className="text-xs mt-1.5 max-w-md leading-relaxed">{error}</p>
                <button 
                  onClick={fetchEvents}
                  className="mt-5 nb-btn px-5 py-2.5 bg-white text-[#1a1a2e] text-xs"
                >
                  🔄 Reload Catalog
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white nb-border py-20 text-center p-6 space-y-4 nb-shadow">
                <div className="mx-auto h-20 w-20 bg-[#FFD700] nb-border text-[#1a1a2e] flex items-center justify-center rounded-full animate-float">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#1a1a2e]">No Events Found 😔</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed font-medium">
                    No results for "{searchQuery}" in {selectedCategory}. Seed some events to get started!
                  </p>
                </div>
                <button
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="nb-btn px-6 py-3 bg-[#7CFC00] text-[#1a1a2e] text-sm flex items-center space-x-2 mx-auto"
                >
                  <Database className="h-4 w-4" />
                  <span>{isSeeding ? 'Seeding...' : '🌱 Seed Events'}</span>
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              
              /* ===== GRID LAYOUT ===== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="grid-layout">
                {events.map((ev: Event, index: number) => {
                  const capacityPercent = Math.round((ev.availableSeats / ev.capacity) * 100);
                  const isSoldOut = ev.availableSeats === 0 || ev.status === 'Sold Out';
                  const isLowStock = ev.availableSeats > 0 && ev.availableSeats < 15;
                  const accent = getCardAccent(index);

                  return (
                    <div 
                      key={ev.id} 
                      onClick={() => handleOpenDetails(ev)}
                      onMouseEnter={() => setHoveredCard(ev.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className={`bg-white nb-border-thick nb-card-hover flex flex-col cursor-pointer relative group overflow-hidden animate-card-enter stagger-${(index % 6) + 1}`}
                      style={{ 
                        boxShadow: hoveredCard === ev.id ? `8px 8px 0px ${accent}` : '4px 4px 0px #1a1a2e',
                      }}
                    >
                      {/* Colored top accent bar */}
                      <div className="h-2" style={{ backgroundColor: accent }} />
                      
                      {/* Category & Actions */}
                      <div className="px-5 pt-4 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 ${getCategoryColor(ev.category)} flex items-center space-x-1.5`}>
                          {getCategoryIcon(ev.category)}
                          <span>{ev.category}</span>
                        </span>

                        {currentUser && currentUser.role === 'Organizer' && currentUser.id === ev.organizerId && (
                          <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e: any) => openEditModal(ev, e)}
                              className="nb-btn p-1.5 bg-[#00D4FF] text-[#1a1a2e] border-2"
                              title="Edit Event"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e: any) => handleDeleteEvent(ev.id, ev.name, e)}
                              className="nb-btn p-1.5 bg-[#FF4757] text-white border-2"
                              title="Delete Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Event Info */}
                      <div className="p-5 flex-1 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-black tracking-widest uppercase" style={{ color: accent }}>{ev.code}</span>
                          <h4 className="text-lg font-black text-[#1a1a2e] leading-snug truncate group-hover:text-[#FF6B9D] transition-colors">
                            {ev.name}
                          </h4>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed font-medium">
                          {ev.description || 'Join this upcoming premium event in Indonesia. Book early for amazing discounts! 🎉'}
                        </p>

                        <div className="space-y-2 pt-1 text-[#1a1a2e] text-xs font-semibold">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3.5 w-3.5" style={{ color: accent }} />
                            <span>{ev.date} at {ev.time || '19:00'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="pt-3 border-t-3 border-dashed border-gray-300 flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-black">Price</span>
                          <span className="font-black text-lg text-[#1a1a2e]">
                            {ev.price === 0 ? (
                              <span className="bg-[#7CFC00] nb-border border-2 px-2 py-0.5 text-sm">FREE!</span>
                            ) : formatRupiah(ev.price)}
                          </span>
                        </div>
                      </div>

                      {/* Seats Footer */}
                      <div className="px-5 pb-4 pt-3 bg-gray-50 space-y-2.5 border-t-3 border-[#1a1a2e]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 font-bold">Seat Inventory</span>
                          <span className={`font-mono font-black px-2.5 py-1 border-2 border-[#1a1a2e] text-[10px] ${
                            isSoldOut 
                              ? 'bg-[#FF4757] text-white' 
                              : isLowStock 
                                ? 'bg-[#FFD700] text-[#1a1a2e] animate-pulse' 
                                : 'bg-[#7CFC00] text-[#1a1a2e]'
                          }`}>
                            {isSoldOut ? '🚫 SOLD OUT' : `${ev.availableSeats} / ${ev.capacity} left`}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 w-full bg-gray-200 nb-border border-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isSoldOut ? 'bg-[#FF4757]' : isLowStock ? 'bg-[#FFD700]' : 'bg-[#7CFC00]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, capacityPercent))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              
              /* ===== LIST TABLE LAYOUT ===== */
              <div className="bg-white nb-border nb-shadow overflow-hidden" id="list-layout">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFD700] border-b-3 border-[#1a1a2e] text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">
                        <th className="py-4 px-5">Event</th>
                        <th className="py-4 px-5">SKU Code</th>
                        <th className="py-4 px-5">Category</th>
                        <th className="py-4 px-5">Schedule & Venue</th>
                        <th className="py-4 px-5 text-right">Price</th>
                        <th className="py-4 px-5 text-center">Status</th>
                        <th className="py-4 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-3 divide-[#1a1a2e] text-xs text-[#1a1a2e]">
                      {events.map((ev: Event, index: number) => {
                        const isSoldOut = ev.availableSeats === 0 || ev.status === 'Sold Out';
                        return (
                          <tr key={ev.id} onClick={() => handleOpenDetails(ev)} className={`cursor-pointer transition-colors hover:bg-[#FFD700]/10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="py-4 px-5">
                              <p className="text-sm font-black text-[#1a1a2e] leading-snug">{ev.name}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5 font-mono font-bold">ID: {ev.id.slice(0, 8).toUpperCase()}</p>
                            </td>
                            <td className="py-4 px-5 font-mono text-[11px] font-black text-[#1a1a2e] uppercase">
                              <span className="bg-gray-100 nb-border border-2 px-2 py-0.5">{ev.code}</span>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 border-2 text-[9px] font-black uppercase tracking-wider ${getCategoryColor(ev.category)}`}>
                                {getCategoryIcon(ev.category)}
                                <span>{ev.category}</span>
                              </span>
                            </td>
                            <td className="py-4 px-5 space-y-1">
                              <div className="flex items-center space-x-1.5 font-bold">
                                <Calendar className="h-3 w-3 text-[#FF6B9D]" />
                                <span>{ev.date} at {ev.time || '19:00'}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-medium">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[150px]">{ev.location}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-right font-black text-[#1a1a2e] text-sm">
                              {ev.price === 0 ? <span className="bg-[#7CFC00] border-2 border-[#1a1a2e] px-2 py-0.5 text-[10px]">FREE!</span> : formatRupiah(ev.price)}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <span className={`inline-block font-mono font-black px-3 py-1 border-2 border-[#1a1a2e] text-[10px] ${
                                isSoldOut ? 'bg-[#FF4757] text-white' : 'bg-[#7CFC00] text-[#1a1a2e]'
                              }`}>
                                {isSoldOut ? '🚫 SOLD OUT' : `${ev.availableSeats} / ${ev.capacity}`}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button className="nb-btn px-3 py-1.5 text-[10px] bg-[#FFD700] text-[#1a1a2e]">
                                View →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================== PAGINATION =================== */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4" id="pagination-controls">
                <span className="text-xs text-gray-500 font-bold">
                  Page <span className="bg-[#FFD700] px-2 py-0.5 nb-border border-2 font-black text-[#1a1a2e]">{currentPage}</span> of <strong>{totalPages}</strong> ({totalCount} events)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                    className="nb-btn p-2 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`nb-btn px-3.5 py-1.5 text-xs font-mono transition-all ${
                        currentPage === idx + 1
                          ? 'bg-[#1a1a2e] text-[#FFD700]'
                          : 'bg-white text-[#1a1a2e]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                    className="nb-btn p-2 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* =================== VIEW 2: ORGANIZER DASHBOARD =================== */}
        {activeTab === 'dashboard' && currentUser?.role === 'Organizer' && (
          <div className="space-y-8" id="dashboard-panel">
            
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-4 border-[#1a1a2e]">
              <div>
                <h2 className="text-3xl font-black text-[#1a1a2e]">📊 Management Suite</h2>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">Publish events, track sales, monitor revenue in real-time</p>
              </div>
              <button
                onClick={openCreateModal}
                className="nb-btn px-6 py-3 bg-[#7CFC00] text-[#1a1a2e] text-sm flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>List New Event</span>
              </button>
            </div>

            {/* Stats Cards */}
            {dashboardStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-[#FFD700] nb-border-thick p-6 nb-shadow-lg nb-card-hover">
                  <span className="text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">💰 Total Revenue</span>
                  <h3 className="text-2xl font-black text-[#1a1a2e] mt-2">
                    {formatRupiah(dashboardStats.summary?.totalSalesRevenue || 0)}
                  </h3>
                  <p className="text-xs font-bold flex items-center space-x-1 mt-2 text-[#1a1a2e]/70">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    <span>Verified payouts</span>
                  </p>
                </div>

                <div className="bg-[#FF6B9D] nb-border-thick p-6 nb-shadow-lg nb-card-hover">
                  <span className="text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">🎫 Tickets Sold</span>
                  <h3 className="text-3xl font-black text-[#1a1a2e] mt-2">{dashboardStats.summary?.ticketsSold || 0}</h3>
                  <p className="text-xs font-bold mt-2 text-[#1a1a2e]/70">Attendees registered</p>
                </div>

                <div className="bg-[#00D4FF] nb-border-thick p-6 nb-shadow-lg nb-card-hover">
                  <span className="text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">📅 Active Events</span>
                  <h3 className="text-3xl font-black text-[#1a1a2e] mt-2">{dashboardStats.summary?.activeEventsCount || 0}</h3>
                  <p className="text-xs font-bold mt-2 text-[#1a1a2e]/70">Open for booking</p>
                </div>
              </div>
            ) : (
              <div className="bg-white nb-border p-8 text-center nb-shadow">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#FFD700]" />
                <span className="text-sm font-bold text-gray-500">Computing analytics... 📊</span>
              </div>
            )}

            {/* Charts Panel */}
            <div className="bg-white nb-border p-6 nb-shadow space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-3 border-[#1a1a2e] pb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-[#FF6B9D]" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#1a1a2e]">Sales & Occupancy Analytics</h4>
                </div>
                
                {/* Range selector */}
                <div className="flex items-center nb-border bg-[#FFFEF9] p-1">
                  {(['daily', 'monthly', 'yearly'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setStatsRange(range)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                        statsRange === range 
                          ? 'bg-[#FFD700] text-[#1a1a2e] nb-shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts */}
              {dashboardStats && dashboardStats.reports ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-8 space-y-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">💰 Revenue Over Time</span>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dashboardStats.reports[statsRange] || []}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="name" stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                          <YAxis stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                          <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Ticket Volume Chart */}
                  <div className="lg:col-span-4 space-y-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">🎫 Ticket Volume</span>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardStats.reports[statsRange] || []}
                          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="name" stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                          <YAxis stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                          <Tooltip formatter={(value) => [value, 'Tickets Sold']} />
                          <Bar dataKey="tickets" fill="#FF6B9D" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 nb-border">
                  <p className="text-sm text-gray-400 font-bold">No transaction data yet. Charts need ticket sales. 📈</p>
                </div>
              )}
            </div>

            {/* Organizer Events Table */}
            <div className="bg-white nb-border p-6 nb-shadow space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-3 border-[#1a1a2e]">
                <span className="text-sm font-black uppercase tracking-wider text-[#1a1a2e]">📋 Your Managed Events</span>
                <span className="text-[10px] text-gray-400 font-mono font-bold">Edit/Remove from here</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1a1a2e] border-collapse">
                  <thead>
                    <tr className="bg-[#1a1a2e] text-[#FFD700] text-[10px] uppercase tracking-wider font-black">
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-center">Seats</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#1a1a2e]">
                    {events.filter((e: Event) => e.organizerId === currentUser?.id).map((ev: Event) => (
                      <tr key={ev.id} className="hover:bg-[#FFD700]/10 transition-colors">
                        <td className="py-3 px-4 font-black text-[#1a1a2e]">{ev.name}</td>
                        <td className="py-3 px-4 font-mono font-bold"><span className="bg-gray-100 border-2 border-[#1a1a2e] px-1.5 py-0.5">{ev.code}</span></td>
                        <td className="py-3 px-4 font-medium">{ev.date}</td>
                        <td className="py-3 px-4 text-right font-bold">{ev.price === 0 ? 'FREE' : formatRupiah(ev.price)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 border-2 border-[#1a1a2e] text-[10px] font-mono font-black ${
                            ev.availableSeats === 0 ? 'bg-[#FF4757] text-white' : 'bg-[#7CFC00] text-[#1a1a2e]'
                          }`}>
                            {ev.availableSeats} / {ev.capacity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={(e: any) => openEditModal(ev, e)}
                            className="text-[11px] font-black text-[#00D4FF] hover:text-[#FF6B9D] uppercase transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={(e: any) => handleDeleteEvent(ev.id, ev.name, e)}
                            className="text-[11px] font-black text-[#FF4757] hover:text-[#1a1a2e] uppercase transition-colors"
                          >
                            🗑️ Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {events.filter((e: Event) => e.organizerId === currentUser?.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400 font-bold">
                          You haven't listed any events yet. Click "List New Event" to start! 🚀
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* =================== FOOTER =================== */}
      <footer className="bg-[#1a1a2e] border-t-4 border-[#FFD700] py-10 px-6 text-center mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-[#FFD700] nb-border flex items-center justify-center">
              <Ticket className="h-5 w-5 text-[#1a1a2e]" />
            </div>
            <div className="text-left">
              <span className="font-black text-lg text-[#FFD700]">EVENT KUY</span>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Neo-Brutal Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {['🎵 Music', '💻 Tech', '🎨 Art', '🍜 Food', '🏆 Sports'].map((cat) => (
              <span key={cat} className="bg-[#1a1a2e] text-gray-300 border-2 border-gray-600 px-3 py-1 text-[10px] font-bold uppercase hover:border-[#FFD700] hover:text-[#FFD700] transition-colors cursor-pointer">
                {cat}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 font-bold">© 2026 Event Kuy. All rights reserved. 🇮🇩</p>
        </div>
      </footer>

      {/* =================== AUTH MODAL =================== */}
      {isAuthOpen && (
        <div className="fixed inset-0 nb-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white nb-border-thick max-w-md w-full shadow-2xl relative nb-shadow-lg animate-bounce-in overflow-hidden">
            {/* Colored header bar */}
            <div className="h-3 bg-[#FF6B9D]" />
            
            <div className="p-6">
              <button 
                onClick={() => {
                  setIsAuthOpen(false);
                  resetAuthFields();
                }}
                className="absolute top-6 right-5 nb-btn p-1 bg-white border-2 hover:bg-[#FF4757] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center mb-6">
                <span className="inline-block bg-[#FFD700] nb-border border-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-3">🎫 Event Kuy</span>
                <h3 className="text-2xl font-black text-[#1a1a2e]">
                  {authMode === 'login' ? '👋 Welcome Back!' : '🚀 Join Now!'}
                </h3>
              </div>

              {authError && (
                <div className="bg-[#FF4757] nb-border border-2 p-3 mb-4 text-xs text-white flex items-center space-x-2 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Isyana Sarasvati"
                      value={authName}
                      onChange={(e: { target: { value: any; }; }) => setAuthName(e.target.value)}
                      className="nb-input w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.id"
                    value={authEmail}
                    onChange={(e: { target: { value: any; }; }) => setAuthEmail(e.target.value)}
                    className="nb-input w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e: { target: { value: any; }; }) => setAuthPassword(e.target.value)}
                    className="nb-input w-full"
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-2">Select Your Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAuthRole('Customer')}
                          className={`nb-btn py-2.5 text-xs ${
                            authRole === 'Customer' 
                              ? 'bg-[#7CFC00] text-[#1a1a2e]' 
                              : 'bg-white text-gray-500'
                          }`}
                        >
                          🎭 Attendee
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthRole('Organizer')}
                          className={`nb-btn py-2.5 text-xs ${
                            authRole === 'Organizer' 
                              ? 'bg-[#00D4FF] text-[#1a1a2e]' 
                              : 'bg-white text-gray-500'
                          }`}
                        >
                          🎯 Organizer
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Referral Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. REF-BUDI-1234"
                        value={authReferredBy}
                        onChange={(e: { target: { value: any; }; }) => setAuthReferredBy(e.target.value)}
                        className="nb-input w-full"
                      />
                      <span className="text-[9px] text-gray-400 mt-1 block font-bold">🎁 Get a 10% welcome coupon valid for 3 months!</span>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="nb-btn w-full py-3 bg-[#1a1a2e] text-[#FFD700] text-sm mt-4"
                >
                  {authMode === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
                </button>
              </form>

              <div className="pt-4 border-t-3 border-[#1a1a2e] text-center text-xs mt-6">
                {authMode === 'login' ? (
                  <p className="font-bold text-gray-500">
                    New here?{' '}
                    <button onClick={() => setAuthMode('register')} className="text-[#FF6B9D] font-black hover:underline">
                      Create account →
                    </button>
                  </p>
                ) : (
                  <p className="font-bold text-gray-500">
                    Already have one?{' '}
                    <button onClick={() => setAuthMode('login')} className="text-[#FF6B9D] font-black hover:underline">
                      Sign in →
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== EVENT CREATE/EDIT MODAL =================== */}
      {isModalOpen && (
        <div className="fixed inset-0 nb-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white nb-border-thick max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto nb-shadow-lg animate-bounce-in">
            {/* Colored header */}
            <div className="h-3 bg-[#7CFC00]" />
            
            <div className="p-6">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-5 nb-btn p-1 bg-white border-2 hover:bg-[#FF4757] hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5 pb-3 border-b-3 border-[#1a1a2e]">
                <span className="inline-block bg-[#7CFC00] nb-border border-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-2">🛠️ Organizer Tool</span>
                <h3 className="text-xl font-black text-[#1a1a2e]">
                  {modalMode === 'create' ? '📝 Publish New Event' : '✏️ Edit Event Details'}
                </h3>
              </div>

              {formError && (
                <div className="bg-[#FF4757] nb-border border-2 p-3 mb-4 text-xs text-white flex items-center space-x-2 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intimate Concert with Isyana"
                    value={formName}
                    onChange={(e: { target: { value: any; }; }) => setFormName(e.target.value)}
                    className="nb-input w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Description</label>
                  <textarea
                    placeholder="Write an exciting description..."
                    rows={3}
                    value={formDescription}
                    onChange={(e: { target: { value: any; }; }) => setFormDescription(e.target.value)}
                    className="nb-input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">SKU Code</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        required
                        placeholder="SKU-2026-99"
                        value={formCode}
                        onChange={(e: { target: { value: any; }; }) => setFormCode(e.target.value)}
                        className="nb-input w-full font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleAutoGenerateCode}
                        className="nb-btn px-3 py-1 text-[10px] bg-[#FFD700]"
                      >
                        Gen
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e: { target: { value: any; }; }) => setFormCategory(e.target.value)}
                      className="nb-select w-full"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Price (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formPrice}
                      onChange={(e: { target: { value: any; }; }) => setFormPrice(Number(e.target.value))}
                      className="nb-input w-full font-mono"
                    />
                    <span className="text-[8px] text-gray-400 mt-1 block font-bold">0 = Free event</span>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formCapacity}
                      onChange={(e: { target: { value: any; }; }) => {
                        setFormCapacity(Number(e.target.value));
                        if (modalMode === 'create') {
                          setFormAvailableSeats(Number(e.target.value));
                        }
                      }}
                      className="nb-input w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Available</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formAvailableSeats}
                      onChange={(e: { target: { value: any; }; }) => setFormAvailableSeats(Number(e.target.value))}
                      className="nb-input w-full font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e: { target: { value: any; }; }) => setFormDate(e.target.value)}
                      className="nb-input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 19:30"
                      value={formTime}
                      onChange={(e: { target: { value: any; }; }) => setFormTime(e.target.value)}
                      className="nb-input w-full font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Venue Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gelora Bung Karno, Jakarta"
                    value={formLocation}
                    onChange={(e: { target: { value: any; }; }) => setFormLocation(e.target.value)}
                    className="nb-input w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: { target: { value: any; }; }) => setFormStatus(e.target.value)}
                    className="nb-select w-full"
                  >
                    {STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="nb-btn w-full py-3 bg-[#1a1a2e] text-[#7CFC00] disabled:opacity-40 text-sm mt-4"
                >
                  {isSubmitting ? '⏳ Saving...' : modalMode === 'create' ? '🚀 Publish Event' : '💾 Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =================== EVENT DETAILS + CHECKOUT MODAL =================== */}
      {isDetailsOpen && selectedEvent && (
        <div className="fixed inset-0 nb-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white nb-border-thick max-w-3xl w-full shadow-2xl relative max-h-[95vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 nb-shadow-xl animate-bounce-in">
            
            {/* Close */}
            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 nb-btn p-1.5 bg-white border-2 z-10 hover:bg-[#FF4757] hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>

            {/* Left Column: Details & Reviews */}
            <div className="md:col-span-7 p-6 space-y-5">
              
              {/* Colored accent */}
              <div className="h-2 -mx-6 -mt-6 mb-4 bg-[#FF6B9D]" />

              <div className="space-y-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 ${getCategoryColor(selectedEvent.category)} inline-flex items-center space-x-1`}>
                  {getCategoryIcon(selectedEvent.category)}
                  <span>{selectedEvent.category}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 block font-bold">SKU: {selectedEvent.code}</span>
                <h3 className="text-xl font-black text-[#1a1a2e] tracking-tight leading-snug">{selectedEvent.name}</h3>
              </div>

              <div className="space-y-2.5 text-xs text-[#1a1a2e] font-bold">
                <div className="flex items-center space-x-2.5">
                  <Calendar className="h-4 w-4 text-[#FF6B9D] shrink-0" />
                  <span><strong>Date:</strong> {selectedEvent.date} at {selectedEvent.time || '19:00'}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <MapPin className="h-4 w-4 text-[#FF6B9D] shrink-0" />
                  <span><strong>Venue:</strong> {selectedEvent.location}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Users className="h-4 w-4 text-[#FF6B9D] shrink-0" />
                  <span><strong>Tickets:</strong> {selectedEvent.availableSeats} of {selectedEvent.capacity} left</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 block">📄 About</span>
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 nb-border border-2 font-medium">
                  {selectedEvent.description || 'An upcoming premium event scheduled on the platform. Purchase tickets early for early bird pricing! 🎉'}
                </p>
              </div>

              {/* Reviews */}
              <div className="space-y-4 pt-3 border-t-3 border-[#1a1a2e]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 flex items-center space-x-1">
                    <Star className="h-3.5 w-3.5 text-[#FFD700] fill-[#FFD700]" />
                    <span>Reviews & Feedback</span>
                  </span>
                  
                  {reviewsStats.totalReviews > 0 && (
                    <span className="text-xs font-black text-[#1a1a2e] bg-[#FFD700] nb-border border-2 px-2 py-0.5">
                      ⭐ {reviewsStats.averageRating} / 5 ({reviewsStats.totalReviews})
                    </span>
                  )}
                </div>

                {isReviewsLoading ? (
                  <div className="py-6 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                    <span className="text-[10px] font-bold">Loading reviews...</span>
                  </div>
                ) : selectedEventReviews.length === 0 ? (
                  <p className="text-xs text-gray-400 font-bold italic">No reviews yet for this event. 📝</p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {selectedEventReviews.map((r: { id: any; userName: any; rating: any; feedback: any; }) => (
                      <div key={r.id} className="bg-white p-3 nb-border border-2 space-y-1 nb-shadow-sm">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-[#1a1a2e]">{r.userName}</span>
                          <span className="flex items-center text-[#FFD700]">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic">"{r.feedback}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write review (only for verified buyers) */}
                {hasPurchasedSelectedEvent() && (
                  <form onSubmit={handleSubmitFeedback} className="bg-[#FFD700]/20 p-4 nb-border border-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#1a1a2e] uppercase">✍️ Write Review</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-gray-400 font-bold">Rating:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className={`p-0.5 text-[#FFD700] hover:scale-125 transition-transform ${userRating >= star ? '' : 'opacity-30'}`}
                            >
                              <Star className={`h-4 w-4 ${userRating >= star ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {feedbackError && <p className="text-[10px] text-[#FF4757] font-bold">{feedbackError}</p>}

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Share your experience..."
                        value={userFeedback}
                        onChange={(e: { target: { value: any; }; }) => setUserFeedback(e.target.value)}
                        className="nb-input flex-1"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="nb-btn px-4 py-1.5 bg-[#1a1a2e] text-[#FFD700] text-[10px]"
                      >
                        Post
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

            {/* Right Column: Checkout */}
            <div className="md:col-span-5 bg-[#1a1a2e] border-l-4 border-[#FFD700] p-5 space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#FFD700] block border-b-2 border-[#FFD700]/30 pb-2">🎟️ Ticket Checkout</span>
                
                {/* Price display */}
                <div className="bg-[#FFD700] p-4 nb-border border-2 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-black text-[#1a1a2e]">Standard Price</span>
                  <h4 className="text-xl font-black text-[#1a1a2e]">
                    {selectedEvent.price === 0 ? 'FREE REGISTRATION 🎉' : formatRupiah(selectedEvent.price)}
                  </h4>
                  {selectedEvent.price > 0 && (
                    <p className="text-[10px] text-[#1a1a2e]/70 font-bold">
                      * 5% early-bird discount if booked 30+ days ahead
                    </p>
                  )}
                </div>

                {/* Coupon & Points */}
                {selectedEvent.price > 0 && currentUser && currentUser.role === 'Customer' && (
                  <div className="space-y-3">
                    {/* Coupon */}
                    {userProfile?.coupons && userProfile.coupons.length > 0 && (
                      <div className="bg-white/10 p-3.5 border-2 border-[#FFD700]/30 space-y-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!applyCouponId}
                            onChange={(e: { target: { checked: any; }; }) => setApplyCouponId(e.target.checked ? userProfile.coupons[0].id : '')}
                            className="h-4 w-4 accent-[#FFD700]"
                          />
                          <span className="text-xs font-black text-white">🎟️ Apply Welcome Coupon</span>
                        </label>
                        <p className="text-[9px] text-gray-400 pl-6 font-bold">Extra 10% off at checkout</p>
                      </div>
                    )}

                    {/* Points */}
                    {currentUser.pointsBalance > 0 && (
                      <div className="bg-white/10 p-3.5 border-2 border-[#FFD700]/30 space-y-3">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={redeemPoints}
                            onChange={(e: { target: { checked: any; }; }) => {
                              setRedeemPoints(e.target.checked);
                              if (e.target.checked) {
                                setPointsToUseInput(currentUser.pointsBalance);
                              }
                            }}
                            className="h-4 w-4 accent-[#FFD700]"
                          />
                          <span className="text-xs font-black text-white">💰 Redeem Points</span>
                        </label>
                        
                        {redeemPoints && (
                          <div className="space-y-1 pl-6">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-300 font-bold font-mono">Use:</span>
                              <input
                                type="number"
                                min="1"
                                max={currentUser.pointsBalance}
                                value={pointsToUseInput}
                                onChange={(e: { target: { value: any; }; }) => setPointsToUseInput(Math.min(currentUser.pointsBalance, Number(e.target.value)))}
                                className="w-24 bg-[#1a1a2e] border-2 border-[#FFD700] p-1.5 text-[10px] font-mono text-center text-[#FFD700] focus:outline-none"
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 block font-bold">(1 pt = IDR 1. Max: {currentUser.pointsBalance} pts)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Receipt */}
                <div className="space-y-2 bg-white/5 p-4 border-2 border-[#FFD700]/30 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-white">{formatRupiah(checkoutPricing.originalPrice)}</span>
                  </div>
                  {checkoutPricing.earlyBird > 0 && (
                    <div className="flex justify-between text-[#7CFC00]">
                      <span>Early Bird (5%):</span>
                      <span className="font-mono font-bold">-{formatRupiah(checkoutPricing.earlyBird)}</span>
                    </div>
                  )}
                  {checkoutPricing.coupon > 0 && (
                    <div className="flex justify-between text-[#7CFC00]">
                      <span>Coupon (10%):</span>
                      <span className="font-mono font-bold">-{formatRupiah(checkoutPricing.coupon)}</span>
                    </div>
                  )}
                  {checkoutPricing.points > 0 && (
                    <div className="flex justify-between text-[#7CFC00]">
                      <span>Points Redeemed:</span>
                      <span className="font-mono font-bold">-{formatRupiah(checkoutPricing.points)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black border-t-2 border-[#FFD700] pt-2 text-[#FFD700] text-base mt-2">
                    <span>TOTAL:</span>
                    <span className="text-lg">{formatRupiah(checkoutPricing.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <button
                onClick={handleBookTicket}
                disabled={isBooking || selectedEvent.availableSeats <= 0}
                className={`w-full py-3.5 nb-btn text-sm ${
                  selectedEvent.availableSeats <= 0 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-500' 
                    : 'bg-[#FFD700] text-[#1a1a2e] animate-pulse-glow'
                }`}
              >
                {isBooking ? '⏳ Processing...' : selectedEvent.availableSeats <= 0 ? '🚫 SOLD OUT' : '🎫 Confirm & Purchase Ticket'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
