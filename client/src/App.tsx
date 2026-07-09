import React, { useState, useEffect } from 'react';
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
  CalendarCheck
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

  // Map category color schemes
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Music': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'Technology': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Arts & Crafts': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Food & Culinary': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'Workshop': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Sports': return 'bg-sky-50 text-sky-700 border-sky-100';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
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
      <div className="bg-amber-50 border border-amber-200 p-4 mb-4 text-xs text-amber-800 flex items-start space-x-3">
        <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-[10px]">Upcoming Expiration Alerts</p>
          {closeToExpirePoints.map((p: { id: any; amount: number; expiryDate: any; }) => (
            <p key={p.id}>• {formatRupiah(p.amount)} referral reward points will expire on <strong>{p.expiryDate}</strong>.</p>
          ))}
          {closeToExpireCoupons.map((c: { id: any; code: any; expiryDate: any; }) => (
            <p key={c.id}>• Your 10% welcome coupon [<strong>{c.code}</strong>] will expire on <strong>{c.expiryDate}</strong>.</p>
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

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#C5A059]/20" id="app-root-container">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-6 py-4 border shadow-2xl transition-all transform animate-bounce rounded-none ${
            toast.type === 'success' 
              ? 'bg-white border-[#C5A059] text-[#1A1A1A]' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
          id="toast-alert"
        >
          <div className={`p-1.5 ${toast.type === 'success' ? 'bg-amber-50 text-[#C5A059]' : 'bg-rose-100 text-rose-700'} rounded-full`}>
            {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">System Notification</span>
            <span className="text-xs font-semibold mt-0.5">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-[#1A1A1A] text-[#E5D7B9] text-[10px] font-mono py-2.5 px-6 uppercase tracking-widest text-center border-b border-[#333333] flex items-center justify-center space-x-2">
        <Sparkles className="h-3 w-3 animate-pulse text-[#C5A059]" />
        <span>Indonesian Premium Ticket Exchange Platform</span>
        <span className="hidden md:inline-block">•</span>
        <span className="hidden md:inline-block font-bold text-white">Secure SQLite & Referral Ledger Active</span>
      </div>

      {/* Premium Header */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#EBE8E2] sticky top-0 z-40 px-6 py-4" id="main-navigation">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="h-11 w-11 bg-[#1A1A1A] text-[#C5A059] flex items-center justify-center border border-[#C5A059] shadow-sm relative overflow-hidden">
              <Ticket className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif italic font-extrabold tracking-tight text-xl text-[#1A1A1A]">EVENT KUY</span>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mt-0.5">Event Management Hub</p>
            </div>
          </div>

          {/* Center Tabs for Navigation */}
          {currentUser && (
            <div className="flex items-center border border-[#E0DDD7] bg-[#FAF9F6] p-1">
              <button 
                onClick={() => setActiveTab('explore')}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'explore' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Explore Events
              </button>
              {currentUser.role === 'Organizer' && (
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'dashboard' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Organizer Dashboard
                </button>
              )}
            </div>
          )}

          {/* User Session Controller */}
          <div className="flex items-center space-x-3">
            {!currentUser ? (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#8A7144] hover:border-[#8A7144] border border-[#1A1A1A] text-[11px] font-bold uppercase tracking-widest flex items-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-97"
                id="login-trigger-btn"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In / Register</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-zinc-800">{currentUser.name}</p>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-wider">{currentUser.role} Role</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-[#1A1A1A] transition-colors"
                  title="Sign Out Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Expirations Warning Bar (for Points & Coupons expiration within 30 days) */}
      {currentUser && (
        <div className="max-w-7xl mx-auto w-full px-6 mt-6">
          {renderExpirationsWarning()}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* VIEW 1: EXPLORE CATALOG */}
        {activeTab === 'explore' && (
          <div className="space-y-8" id="explore-panel">
            
            {/* Customer Points & Voucher overview widget if logged in */}
            {currentUser && currentUser.role === 'Customer' && (
              <div className="bg-[#FAF9F6] border border-[#EBE8E2] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xs">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Your Referral Number</span>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-mono font-extrabold text-zinc-800 tracking-wider bg-white border border-zinc-200 px-3 py-1">{currentUser.referralCode}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser.referralCode);
                        showToast('Referral code copied to clipboard!');
                      }}
                      className="text-[10px] font-semibold text-[#8A7144] hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">Share with colleagues! You get 10,000 points (IDR 10,000 equivalent discount) for every new signup.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Available Points Balance</span>
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4.5 w-4.5 text-[#C5A059]" />
                    <h4 className="text-xl font-bold text-[#1A1A1A]">{formatRupiah(currentUser.pointsBalance)}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500">Each earned point package expires exactly 3 months from its creation date.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Active Coupon Offers</span>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4.5 w-4.5 text-emerald-600" />
                    <span className="text-xs font-bold text-zinc-800">
                      {userProfile?.coupons && userProfile.coupons.length > 0 
                        ? `${userProfile.coupons.length} Welcoming Coupon(s) Active (10%)`
                        : 'No promo coupons available'
                      }
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Apply coupon at checkout inside details modal for an extra 10% discount.</p>
                </div>
              </div>
            )}

            {/* Filter, Search & Location Grid */}
            <div className="bg-white border border-[#EBE8E2] p-5 shadow-xs space-y-4" id="filters-container">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                
                {/* Search Text with Debounce Indicator */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search events by title, sku (e.g. JAZZ), or description..."
                    value={searchQuery}
                    onChange={(e: { target: { value: any; }; }) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#E0DDD7] py-2.5 pl-10 pr-12 text-xs placeholder-zinc-400 focus:outline-hidden focus:border-[#C5A059]"
                    id="search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDebouncedSearchQuery('');
                      }}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-slate-900 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter by Category */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 whitespace-nowrap">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e: { target: { value: any; }; }) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#E0DDD7] py-2 px-3 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Location */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 whitespace-nowrap">Location/City:</span>
                  <input
                    type="text"
                    placeholder="e.g. Jakarta, Bali"
                    value={selectedLocation}
                    onChange={(e: { target: { value: any; }; }) => {
                      setSelectedLocation(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#E0DDD7] py-1.5 px-3 text-xs focus:outline-hidden max-w-[150px]"
                  />
                </div>

                {/* Filter by Status (Only for Organizer, defaults to Active for customer) */}
                {currentUser?.role === 'Organizer' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 whitespace-nowrap">Status:</span>
                    <select
                      value={selectedStatus}
                      onChange={(e: { target: { value: any; }; }) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-[#E0DDD7] py-2 px-3 text-xs focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Status</option>
                      {STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Layout View Toggles */}
                <div className="flex items-center border border-[#E0DDD7] bg-[#FAF9F6] p-1 self-start lg:self-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-800 shadow-xs border border-zinc-200' : 'text-zinc-400 hover:text-zinc-650'}`}
                    title="Grid layout"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-zinc-800 shadow-xs border border-zinc-200' : 'text-zinc-400 hover:text-zinc-650'}`}
                    title="List layout"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Debounce Feedback Indicator */}
              {searchQuery !== debouncedSearchQuery && (
                <div className="text-[10px] font-mono text-amber-600 animate-pulse flex items-center space-x-1.5 pt-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Waiting for typing pause to execute debounced database query...</span>
                </div>
              )}
            </div>

            {/* Catalog Grid/List */}
            {isLoading ? (
              <div className="bg-white border border-[#EBE8E2] py-28 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
                <Loader2 className="h-10 w-10 animate-spin text-[#C5A059]" />
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest font-extrabold text-[#1A1A1A]">Connecting Ledger database</p>
                  <p className="text-[11px] text-zinc-400">Refreshed catalog seats, point rates, and metadata...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-16 text-center text-rose-950 bg-rose-50/40 border border-rose-200 p-6 flex flex-col items-center justify-center">
                <ShieldAlert className="h-12 w-12 text-rose-700 mb-3" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Database Out of Sync</h3>
                <p className="text-xs mt-1.5 text-rose-600 max-w-md leading-relaxed">{error}</p>
                <button 
                  onClick={fetchEvents}
                  className="mt-5 px-5 py-2.5 bg-rose-900 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Reload Catalog
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white border border-[#EBE8E2] py-20 text-center p-6 space-y-4">
                <div className="mx-auto h-16 w-16 bg-[#FAF9F6] border border-[#EBE8E2] text-[#C5A059] flex items-center justify-center rounded-full">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif italic font-bold text-[#1A1A1A]">No Upcoming Events Listed</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    No results found matching "{searchQuery}" in {selectedCategory}. You can populate exquisite pre-configured Indonesian events using the Seed button in the navigation bar.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={handleSeedDatabase}
                    disabled={isSeeding}
                    className="px-4 py-2 bg-white text-[#1A1A1A] hover:bg-[#FAF9F6] text-xs font-bold uppercase tracking-widest border border-[#E0DDD7] flex items-center space-x-1"
                  >
                    <Database className="h-3.5 w-3.5" />
                    <span>{isSeeding ? 'Populating...' : 'Seed Events'}</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              
              /* 1. Grid Visual Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="grid-layout">
                {events.map((ev: Event) => {
                  const capacityPercent = Math.round((ev.availableSeats / ev.capacity) * 100);
                  const isSoldOut = ev.availableSeats === 0 || ev.status === 'Sold Out';
                  const isLowStock = ev.availableSeats > 0 && ev.availableSeats < 15;

                  let progressBg = 'bg-emerald-500';
                  let badgeText = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                  if (isSoldOut) {
                    progressBg = 'bg-rose-500';
                    badgeText = 'text-rose-700 bg-rose-50 border-rose-100';
                  } else if (isLowStock) {
                    progressBg = 'bg-amber-500 animate-pulse';
                    badgeText = 'text-amber-800 bg-amber-50 border-amber-100';
                  }

                  return (
                    <div 
                      key={ev.id} 
                      onClick={() => handleOpenDetails(ev)}
                      className="bg-white border border-[#EBE8E2] hover:border-[#C5A059] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer relative group overflow-hidden"
                    >
                      {/* Top Action / Category */}
                      <div className="px-5 pt-5 flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${getCategoryColor(ev.category)} flex items-center space-x-1`}>
                          {getCategoryIcon(ev.category)}
                          <span>{ev.category}</span>
                        </span>

                        {currentUser && currentUser.role === 'Organizer' && currentUser.id === ev.organizerId && (
                          <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e: any) => openEditModal(ev, e)}
                              className="p-1.5 border border-[#E0DDD7] bg-white text-zinc-700 hover:bg-zinc-50"
                              title="Edit Event"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e: any) => handleDeleteEvent(ev.id, ev.name, e)}
                              className="p-1.5 border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                              title="Delete Event"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info body */}
                      <div className="p-5 flex-1 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-[#C5A059] uppercase">{ev.code}</span>
                          <h4 className="text-base font-bold text-[#1A1A1A] group-hover:text-[#8A7144] transition-colors leading-snug truncate">
                            {ev.name}
                          </h4>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 h-8 leading-relaxed">
                          {ev.description || 'Join this exquisite upcoming premium gather scheduled in Indonesia. Secure your spots early for date discounts.'}
                        </p>

                        <div className="space-y-1.5 pt-1 text-zinc-650 text-xs">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{ev.date} at {ev.time || '19:00'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Registration Fee</span>
                          <span className="font-serif italic font-extrabold text-base text-[#1A1A1A]">
                            {ev.price === 0 ? 'FREE EVENT' : formatRupiah(ev.price)}
                          </span>
                        </div>
                      </div>

                      {/* Ticket stats footer */}
                      <div className="px-5 pb-5 pt-2 bg-[#FAF9F6]/40 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-550">Seat Inventory</span>
                          <span className={`font-mono font-bold px-2 py-0.5 border text-[9px] ${badgeText}`}>
                            {isSoldOut ? 'SOLD OUT' : `${ev.availableSeats} of ${ev.capacity} left`}
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-zinc-150 overflow-hidden">
                          <div 
                            className={`h-full ${progressBg} transition-all duration-300`}
                            style={{ width: `${Math.min(100, Math.max(0, capacityPercent))}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              
              /* 2. List Visual Table Layout */
              <div className="bg-white border border-[#EBE8E2] shadow-xs overflow-hidden" id="list-layout">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F6] border-b border-[#EBE8E2] text-[10px] uppercase tracking-widest font-extrabold text-zinc-500">
                        <th className="py-4 px-5">Curated Event</th>
                        <th className="py-4 px-5">Registry SKU</th>
                        <th className="py-4 px-5">Category</th>
                        <th className="py-4 px-5">Schedule & Venue</th>
                        <th className="py-4 px-5 text-right">Entrance Price</th>
                        <th className="py-4 px-5 text-center">Status</th>
                        <th className="py-4 px-5 text-right">Booking details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                      {events.map((ev: Event) => {
                        const isSoldOut = ev.availableSeats === 0 || ev.status === 'Sold Out';
                        return (
                          <tr key={ev.id} onClick={() => handleOpenDetails(ev)} className="hover:bg-[#FAF9F6]/45 cursor-pointer transition-colors group">
                            <td className="py-4 px-5">
                              <p className="text-sm font-bold text-[#1A1A1A] leading-snug group-hover:text-[#8A7144]">{ev.name}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">CODE: {ev.id.slice(0, 8).toUpperCase()}</p>
                            </td>
                            <td className="py-4 px-5 font-mono text-[11px] font-bold text-zinc-800 uppercase">
                              {ev.code}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 border text-[9px] font-bold uppercase tracking-wider ${getCategoryColor(ev.category)}`}>
                                {getCategoryIcon(ev.category)}
                                <span>{ev.category}</span>
                              </span>
                            </td>
                            <td className="py-4 px-5 space-y-1">
                              <div className="flex items-center space-x-1.5 text-zinc-850 font-semibold">
                                <Calendar className="h-3 w-3 text-[#8A7144]" />
                                <span>{ev.date} at {ev.time || '19:00'}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[150px]">{ev.location}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-right font-serif italic font-extrabold text-[#1A1A1A] text-sm">
                              {ev.price === 0 ? 'FREE' : formatRupiah(ev.price)}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <span className={`inline-block font-mono font-bold px-2 py-0.5 border text-[10px] ${isSoldOut ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-emerald-50 text-emerald-700 border-emerald-150'}`}>
                                {isSoldOut ? 'SOLD OUT' : `${ev.availableSeats} / ${ev.capacity} SEATS`}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#E0DDD7] bg-white text-zinc-700 group-hover:bg-[#1A1A1A] group-hover:text-white transition-all">
                                View Details
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100" id="pagination-controls">
                <span className="text-xs text-zinc-550">
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (Total {totalCount} events)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                    className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-3.5 py-1.5 text-xs font-bold font-mono transition-all border ${
                        currentPage === idx + 1
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                    className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: ORGANIZER ANALYTICS DASHBOARD */}
        {activeTab === 'dashboard' && currentUser?.role === 'Organizer' && (
          <div className="space-y-8" id="dashboard-panel">
            
            {/* Organizer quick info header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#EBE8E2]">
              <div>
                <h2 className="text-2xl font-serif italic font-extrabold text-zinc-900">Program Management Suite</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Publish new schedules, view attendee registries, and monitor real-time Rupiah transactions.</p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#8A7144] border border-[#1A1A1A] hover:border-[#8A7144] text-[11px] font-bold uppercase tracking-widest flex items-center space-x-2 transition-all shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>List New Event</span>
              </button>
            </div>

            {/* Dashboard stats numbers */}
            {dashboardStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#EBE8E2] p-5 shadow-xs">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Total Bookings Income</span>
                  <h3 className="text-2xl font-serif italic font-extrabold text-[#1A1A1A] mt-1">
                    {formatRupiah(dashboardStats.summary?.totalSalesRevenue || 0)}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 mt-1">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    <span>Rupiah payouts verified on database</span>
                  </p>
                </div>

                <div className="bg-white border border-[#EBE8E2] p-5 shadow-xs">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Tickets Absorbed</span>
                  <h3 className="text-3xl font-extrabold text-zinc-800 mt-1">{dashboardStats.summary?.ticketsSold || 0}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Attendees registered</p>
                </div>

                <div className="bg-white border border-[#EBE8E2] p-5 shadow-xs">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Your Active Schedules</span>
                  <h3 className="text-3xl font-serif italic font-extrabold text-[#C5A059] mt-1">{dashboardStats.summary?.activeEventsCount || 0}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Open programs accepting bookings</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 p-6 text-center text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#C5A059]" />
                <span className="text-xs">Computing real-time transaction reports...</span>
              </div>
            )}

            {/* Charts Panel with range selector */}
            <div className="bg-white border border-[#EBE8E2] p-6 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4.5 w-4.5 text-[#C5A059]" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Sales & Occupancy Analytics</h4>
                </div>
                
                {/* Reporting range: day, month, year */}
                <div className="flex items-center border border-zinc-200 bg-[#FAF9F6] p-1">
                  <button
                    onClick={() => setStatsRange('daily')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      statsRange === 'daily' ? 'bg-white text-zinc-800 shadow-xs border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Daily Report
                  </button>
                  <button
                    onClick={() => setStatsRange('monthly')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      statsRange === 'monthly' ? 'bg-white text-zinc-800 shadow-xs border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Monthly Report
                  </button>
                  <button
                    onClick={() => setStatsRange('yearly')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      statsRange === 'yearly' ? 'bg-white text-zinc-800 shadow-xs border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Yearly Report
                  </button>
                </div>
              </div>

              {/* Chart Visualizer */}
              {dashboardStats && dashboardStats.reports ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Chart: sales revenue */}
                  <div className="lg:col-span-8 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Payout revenue by time-scale</span>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dashboardStats.reports[statsRange] || []}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#C5A059" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" />
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                          <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#C5A059" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Chart: ticket volume */}
                  <div className="lg:col-span-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Ticket volumes absorbed</span>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardStats.reports[statsRange] || []}
                          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" />
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                          <Tooltip formatter={(value) => [value, 'Tickets Sold']} />
                          <Bar dataKey="tickets" fill="#1A1A1A" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-[#FAF9F6] border border-[#EBE8E2]">
                  <p className="text-xs text-zinc-400">Chart rendering expects active ticket transactions.</p>
                </div>
              )}
            </div>

            {/* List of organizer's events */}
            <div className="bg-white border border-[#EBE8E2] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-800">Your Managed Programs Catalog</span>
                <span className="text-[10px] text-zinc-400 font-mono">Filter search for editing on exploration grid</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-700 border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-500 font-extrabold">
                      <th className="py-3 px-4">Event Details</th>
                      <th className="py-3 px-4">Registry SKU</th>
                      <th className="py-3 px-4">Scheduled Date</th>
                      <th className="py-3 px-4 text-right">Entrance Fee</th>
                      <th className="py-3 px-4 text-center">Remaining Seats</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {events.filter((e: Event) => e.organizerId === currentUser?.id).map((ev: Event) => (
                      <tr key={ev.id} className="hover:bg-zinc-50">
                        <td className="py-3 px-4 font-bold text-zinc-800">{ev.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-650">{ev.code}</td>
                        <td className="py-3 px-4">{ev.date}</td>
                        <td className="py-3 px-4 text-right font-semibold">{ev.price === 0 ? 'FREE' : formatRupiah(ev.price)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 border text-[10px] font-mono font-bold ${ev.availableSeats === 0 ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-zinc-50 text-zinc-750'}`}>
                            {ev.availableSeats} of {ev.capacity} left
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={(e: any) => openEditModal(ev, e)}
                            className="text-[11px] font-bold text-zinc-600 hover:text-[#C5A059] uppercase"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e: any) => handleDeleteEvent(ev.id, ev.name, e)}
                            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 uppercase"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {events.filter((e: Event) => e.organizerId === currentUser?.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400">
                          You haven't listed any custom events. Click "List New Event" to publish an upcoming program.
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

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#EBE8E2] py-8 px-6 text-center text-xs text-zinc-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Event Kuy. All rights reserved.</p>
          <div className="flex items-center space-x-4">
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsAuthOpen(false);
                resetAuthFields();
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">Welcome to Event Kuy</span>
              <h3 className="text-xl font-serif italic font-extrabold mt-1">
                {authMode === 'login' ? 'Access Registry Account' : 'Create Exchange Profile'}
              </h3>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-150 p-3 mb-4 text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Isyana Sarasvati"
                    value={authName}
                    onChange={(e: { target: { value: any; }; }) => setAuthName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.id"
                  value={authEmail}
                  onChange={(e: { target: { value: any; }; }) => setAuthEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e: { target: { value: any; }; }) => setAuthPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">User Role Category</label>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => setAuthRole('Customer')}
                        className={`py-2 text-xs font-bold uppercase tracking-wider border ${
                          authRole === 'Customer' 
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        Attendee
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthRole('Organizer')}
                        className={`py-2 text-xs font-bold uppercase tracking-wider border ${
                          authRole === 'Organizer' 
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        Organizer
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Referral Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. REF-BUDI-1234"
                      value={authReferredBy}
                      onChange={(e: { target: { value: any; }; }) => setAuthReferredBy(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                    />
                    <span className="text-[9px] text-zinc-400 mt-1 block">Provides a 10% welcome coupon valid for 3 months upon signup!</span>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#8A7144] text-white text-[11px] font-bold uppercase tracking-widest transition-all mt-4"
              >
                {authMode === 'login' ? 'Sign In to Profile' : 'Register Account'}
              </button>
            </form>

            <div className="pt-4 border-t border-zinc-100 text-center text-xs text-zinc-500 mt-6">
              {authMode === 'login' ? (
                <p>
                  New to Event Kuy?{' '}
                  <button onClick={() => setAuthMode('register')} className="text-[#8A7144] font-bold hover:underline">
                    Create your account
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-[#8A7144] font-bold hover:underline">
                    Access existing account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EVENT CREATION & EDIT MODAL (ORGANIZERS) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700">
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 pb-3 border-b border-zinc-100">
              <span className="text-[9px] uppercase tracking-widest font-bold text-[#C5A059]">Organizer Tool</span>
              <h3 className="text-lg font-serif italic font-bold text-zinc-900 mt-0.5">
                {modalMode === 'create' ? 'Publish Event Listing' : 'Edit Listing Details'}
              </h3>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3 mb-4 text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intimate Concert with Isyana"
                  value={formName}
                  onChange={(e: { target: { value: any; }; }) => setFormName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Description</label>
                <textarea
                  placeholder="Write an elegant description for prospective attendees..."
                  rows={3}
                  value={formDescription}
                  onChange={(e: { target: { value: any; }; }) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">SKU Unique Code</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="SKU-2026-99"
                      value={formCode}
                      onChange={(e: { target: { value: any; }; }) => setFormCode(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="px-3 py-1 text-[10px] font-bold border border-zinc-300 hover:bg-zinc-50 uppercase tracking-wider"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e: { target: { value: any; }; }) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Entrance Price (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e: { target: { value: any; }; }) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden font-mono"
                  />
                  <span className="text-[8px] text-zinc-400 mt-1 block">Set 0 for free events</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Total Capacity</label>
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
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Available Seats</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formAvailableSeats}
                    onChange={(e: { target: { value: any; }; }) => setFormAvailableSeats(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e: { target: { value: any; }; }) => setFormDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 19:30"
                    value={formTime}
                    onChange={(e: { target: { value: any; }; }) => setFormTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Venue Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gelora Bung Karno, Jakarta"
                  value={formLocation}
                  onChange={(e: { target: { value: any; }; }) => setFormLocation(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">Lifecycle Status</label>
                <select
                  value={formStatus}
                  onChange={(e: { target: { value: any; }; }) => setFormStatus(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 py-2 px-3 text-xs focus:outline-hidden cursor-pointer"
                >
                  {STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#8A7144] disabled:opacity-40 text-white text-[11px] font-bold uppercase tracking-widest transition-all mt-4"
              >
                {isSubmitting ? 'Saving changes...' : modalMode === 'create' ? 'Publish Event Listing' : 'Save Event Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAILS, CHECKOUT & RATINGS MODAL */}
      {isDetailsOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 max-w-3xl w-full p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Close */}
            <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 z-10">
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Details & Reviews */}
            <div className="md:col-span-7 space-y-6">
              
              <div className="space-y-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${getCategoryColor(selectedEvent.category)} inline-block`}>
                  {selectedEvent.category}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 block mt-1">SKU: {selectedEvent.code}</span>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight leading-snug">{selectedEvent.name}</h3>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-750">
                <div className="flex items-center space-x-2.5">
                  <Calendar className="h-4 w-4 text-[#8A7144] shrink-0" />
                  <span><strong>Date:</strong> {selectedEvent.date} at {selectedEvent.time || '19:00'}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <MapPin className="h-4 w-4 text-[#8A7144] shrink-0" />
                  <span><strong>Venue:</strong> {selectedEvent.location}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Users className="h-4 w-4 text-[#8A7144] shrink-0" />
                  <span><strong>Available Tickets:</strong> {selectedEvent.availableSeats} of {selectedEvent.capacity} left</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block">About the Program</span>
                <p className="text-xs text-zinc-600 leading-relaxed bg-[#FAF9F6] p-4.5 border border-[#EBE8E2]">
                  {selectedEvent.description || 'This is an upcoming high-profile Indonesian Masterclass scheduled on the platform. Purchase your tickets early to secure early bird pricing and date concessions.'}
                </p>
              </div>

              {/* Reviews Section */}
              <div className="space-y-4 pt-3 border-t border-zinc-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 flex items-center space-x-1">
                    <Star className="h-3.5 w-3.5 text-[#C5A059] fill-[#C5A059]" />
                    <span>Attendee Feedback & Reviews</span>
                  </span>
                  
                  {reviewsStats.totalReviews > 0 && (
                    <span className="text-xs font-serif italic text-zinc-800">
                      Average: <strong>{reviewsStats.averageRating} / 5</strong> ({reviewsStats.totalReviews} reviews)
                    </span>
                  )}
                </div>

                {isReviewsLoading ? (
                  <div className="py-6 text-center text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-zinc-400" />
                    <span className="text-[10px]">Retrieving feedback...</span>
                  </div>
                ) : selectedEventReviews.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No reviews yet for this event.</p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {selectedEventReviews.map((r: { id: any; userName: any; rating: any; feedback: any; }) => (
                      <div key={r.id} className="bg-zinc-50 p-3 border border-zinc-150 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-800">{r.userName}</span>
                          <span className="flex items-center text-[#C5A059]">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-650 leading-relaxed italic">"{r.feedback}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* If verified buyer, show write review box */}
                {hasPurchasedSelectedEvent() && (
                  <form onSubmit={handleSubmitFeedback} className="bg-[#FAF9F6] p-4.5 border border-[#C5A059]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-700 uppercase">Write Event Review</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-zinc-400">Rating:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className={`p-0.5 text-[#C5A059] hover:scale-110 transition-transform ${userRating >= star ? 'fill-current' : 'opacity-30'}`}
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {feedbackError && <p className="text-[10px] text-rose-700">{feedbackError}</p>}

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Share your overall experience and quality feedback..."
                        value={userFeedback}
                        onChange={(e: { target: { value: any; }; }) => setUserFeedback(e.target.value)}
                        className="flex-1 bg-white border border-zinc-200 px-3 py-1.5 text-xs focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#8A7144] text-white text-[10px] font-bold uppercase tracking-wider"
                      >
                        Post
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

            {/* Right Column: Checkout Area */}
            <div className="md:col-span-5 bg-zinc-50 border border-zinc-200 p-5 space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 block border-b border-zinc-200 pb-2">Ticket Checkout</span>
                
                {/* Free or Paid event visual */}
                <div className="bg-white p-4 border border-zinc-200 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Standard Price</span>
                  <h4 className="text-lg font-bold text-zinc-950">
                    {selectedEvent.price === 0 ? 'FREE REGISTRATION' : formatRupiah(selectedEvent.price)}
                  </h4>
                  {selectedEvent.price > 0 && (
                    <p className="text-[10px] text-emerald-600">
                      * 5% early-bird discount automatically applies if booked 30 days prior.
                    </p>
                  )}
                </div>

                {/* PROMOTION REDEMPTIONS (Points & Coupons) */}
                {selectedEvent.price > 0 && currentUser && currentUser.role === 'Customer' && (
                  <div className="space-y-3.5">
                    
                    {/* Welcome Coupon toggle */}
                    {userProfile?.coupons && userProfile.coupons.length > 0 && (
                      <div className="bg-white p-3.5 border border-zinc-200 space-y-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!applyCouponId}
                            onChange={(e: { target: { checked: any; }; }) => setApplyCouponId(e.target.checked ? userProfile.coupons[0].id : '')}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs font-bold text-zinc-800">Apply Referral Welcome Coupon</span>
                        </label>
                        <p className="text-[9px] text-zinc-500 pl-6">Reduces ticket price by an extra <strong>10%</strong> on checkout.</p>
                      </div>
                    )}

                    {/* Points toggle */}
                    {currentUser.pointsBalance > 0 && (
                      <div className="bg-white p-3.5 border border-zinc-200 space-y-3">
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
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs font-bold text-zinc-800">Redeem Referral Points</span>
                        </label>
                        
                        {redeemPoints && (
                          <div className="space-y-1 pl-6">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-zinc-550 font-bold font-mono">Use Points:</span>
                              <input
                                type="number"
                                min="1"
                                max={currentUser.pointsBalance}
                                value={pointsToUseInput}
                                onChange={(e: { target: { value: any; }; }) => setPointsToUseInput(Math.min(currentUser.pointsBalance, Number(e.target.value)))}
                                className="w-20 bg-zinc-50 border border-zinc-200 p-1 text-[10px] font-mono text-center focus:outline-hidden"
                              />
                            </div>
                            <span className="text-[9px] text-zinc-400 block">(1 Point = IDR 1 discount balance. Max available: {currentUser.pointsBalance} pts)</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* Final receipt layout */}
                <div className="space-y-2 bg-white p-4 border border-zinc-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal Price:</span>
                    <span className="font-mono">{formatRupiah(checkoutPricing.originalPrice)}</span>
                  </div>
                  {checkoutPricing.earlyBird > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Early Bird Discount (5%):</span>
                      <span className="font-mono">-{formatRupiah(checkoutPricing.earlyBird)}</span>
                    </div>
                  )}
                  {checkoutPricing.coupon > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Welcome Discount Coupon (10%):</span>
                      <span className="font-mono">-{formatRupiah(checkoutPricing.coupon)}</span>
                    </div>
                  )}
                  {checkoutPricing.points > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Referral Points Redeemed:</span>
                      <span className="font-mono">-{formatRupiah(checkoutPricing.points)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-zinc-200 pt-2 text-zinc-900 text-sm">
                    <span>Total Final Price:</span>
                    <span className="font-serif italic text-base">{formatRupiah(checkoutPricing.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Book ticket button */}
              <button
                onClick={handleBookTicket}
                disabled={isBooking || selectedEvent.availableSeats <= 0}
                className="w-full py-3 bg-[#1A1A1A] hover:bg-[#8A7144] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-widest transition-all"
              >
                {isBooking ? 'Completing transaction...' : selectedEvent.availableSeats <= 0 ? 'SOLD OUT' : 'Confirm & Purchase Ticket'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
