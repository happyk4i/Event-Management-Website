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
import ToastNotification from './component/ToastNotification.js';
import TopMarquee from './component/TopMarquee.js';
import MainNavigation from './component/MainNavigation.js';
import HeroSection from './component/HeroSection.js';
import ExpirationsWarning from './component/ExpirationsWarning.js';
import CustomerRewardsPanel from './component/CustomerRewardsPanel.js';
import EventFilters from './component/EventFilters.js';
import EventCatalog from './component/EventCatalog.js';
import Pagination from './component/Pagination.js';
import OrganizerDashboard from './component/OrganizerDashboard.js';
import Footer from './component/Footer.js';
import AuthModal from './component/AuthModal.js';
import EventFormModal from './component/EventFormModal.js';
import EventDetailsModal from './component/EventDetailsModal.js';
import EventAssistantDock from './component/EventAssistantDock.js';

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('ephemeral_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userProfile, setUserProfile] = useState<{ pointRecords: PointRecord[]; coupons: Coupon[] } | null>(null);

  // AI assistant panel
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  // Verification if buyer has purchased ticket to display review box
  const hasPurchasedSelectedEvent = () => {
    if (!currentUser) return false;
    if (!selectedEvent) return false;
    return myTransactions.some((t: { eventId: any; }) => t.eventId === selectedEvent.id);
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
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* =================== MARQUEE TOP BANNER =================== */}
      <TopMarquee />

      {/* =================== NAVIGATION HEADER =================== */}
      <MainNavigation
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setAuthMode={setAuthMode}
        setIsAuthOpen={setIsAuthOpen}
        handleLogout={handleLogout}
      />

      {/* =================== HERO SECTION WITH 3D =================== */}
      {activeTab === 'explore' && <HeroSection totalCount={totalCount} />}

      {/* Expirations Warning */}
      {currentUser && (
        <div className="max-w-7xl mx-auto w-full px-6 mt-6">
          <ExpirationsWarning userProfile={userProfile} />
        </div>
      )}

      {/* =================== MAIN CONTAINER =================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">

        {/* =================== VIEW 1: EXPLORE CATALOG =================== */}
        {activeTab === 'explore' && (
          <div className="space-y-8" id="explore-panel">
            {/* Customer Points & Voucher widget */}
            {currentUser && currentUser.role === 'Customer' && (
              <CustomerRewardsPanel
                currentUser={currentUser}
                userProfile={userProfile}
                copyReferralCode={(code) => {
                  navigator.clipboard.writeText(code);
                  showToast('Referral code copied to clipboard!');
                }}
              />
            )}

            {/* Filter, Search & Location */}
            <EventFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setDebouncedSearchQuery={setDebouncedSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              currentUser={currentUser}
              debouncedSearchQuery={debouncedSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              setCurrentPage={setCurrentPage}
            />

            {/* =================== EVENT CARDS =================== */}
            <EventCatalog
              events={events}
              viewMode={viewMode}
              currentUser={currentUser}
              isLoading={isLoading}
              error={error}
              onOpenDetails={handleOpenDetails}
              onOpenEdit={openEditModal}
              onDeleteEvent={handleDeleteEvent}
              onSeedDatabase={handleSeedDatabase}
              isSeeding={isSeeding}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              fetchEvents={fetchEvents}
            />

            {/* =================== PAGINATION =================== */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}

        {/* =================== VIEW 2: ORGANIZER DASHBOARD =================== */}
        {activeTab === 'dashboard' && currentUser?.role === 'Organizer' && (
          <OrganizerDashboard
            dashboardStats={dashboardStats}
            statsRange={statsRange}
            setStatsRange={setStatsRange}
            events={events}
            currentUser={currentUser}
            openCreateModal={openCreateModal}
            openEditModal={openEditModal}
            handleDeleteEvent={handleDeleteEvent}
          />
        )}

      </main>

      {/* =================== FOOTER =================== */}
      <Footer />

      {/* =================== AUTH MODAL =================== */}
      <AuthModal
        isAuthOpen={isAuthOpen}
        setIsAuthOpen={setIsAuthOpen}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        setAuthName={setAuthName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authRole={authRole}
        setAuthRole={setAuthRole}
        authReferredBy={authReferredBy}
        setAuthReferredBy={setAuthReferredBy}
        authError={authError}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        resetAuthFields={resetAuthFields}
      />

      {/* =================== EVENT CREATE/EDIT MODAL =================== */}
      <EventFormModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalMode={modalMode}
        formError={formError}
        formName={formName}
        setFormName={setFormName}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formCode={formCode}
        setFormCode={setFormCode}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formPrice={formPrice}
        setFormPrice={setFormPrice}
        formCapacity={formCapacity}
        setFormCapacity={setFormCapacity}
        formAvailableSeats={formAvailableSeats}
        setFormAvailableSeats={setFormAvailableSeats}
        formDate={formDate}
        setFormDate={setFormDate}
        formTime={formTime}
        setFormTime={setFormTime}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        handleAutoGenerateCode={handleAutoGenerateCode}
        handleFormSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* =================== EVENT DETAILS + CHECKOUT MODAL =================== */}
      <EventDetailsModal
        isDetailsOpen={isDetailsOpen}
        selectedEvent={selectedEvent}
        setIsDetailsOpen={setIsDetailsOpen}
        reviewsStats={reviewsStats}
        selectedEventReviews={selectedEventReviews}
        isReviewsLoading={isReviewsLoading}
        hasPurchasedSelectedEvent={hasPurchasedSelectedEvent}
        handleSubmitFeedback={handleSubmitFeedback}
        userRating={userRating}
        setUserRating={setUserRating}
        userFeedback={userFeedback}
        setUserFeedback={setUserFeedback}
        feedbackError={feedbackError}
        isSubmittingFeedback={isSubmittingFeedback}
        currentUser={currentUser}
        userProfile={userProfile}
        applyCouponId={applyCouponId}
        setApplyCouponId={setApplyCouponId}
        redeemPoints={redeemPoints}
        setRedeemPoints={setRedeemPoints}
        pointsToUseInput={pointsToUseInput}
        setPointsToUseInput={setPointsToUseInput}
        checkoutPricing={checkoutPricing}
        handleBookTicket={handleBookTicket}
        isBooking={isBooking}
      />

      {/* =================== EVENT ASSISTANT DOCK =================== */}
      {currentUser && (
        <EventAssistantDock isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
      )}

    </div>
  );
}
