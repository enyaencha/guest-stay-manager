import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BookingRequestModal } from "@/components/landing/BookingRequestModal";
import { ReservationLookupModal } from "@/components/landing/ReservationLookupModal";
import { FeedbackModal } from "@/components/landing/FeedbackModal";
import { StaffSecretModal } from "@/components/auth/StaffSecretModal";
import { FeaturedSuitesGallery } from "@/components/landing/FeaturedSuitesGallery";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePropertySettings } from "@/hooks/useSettings";
import { 
  BedDouble, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Utensils,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Users,
  Sparkles,
  ArrowRight,
  Quote,
  Menu,
  X,
  Search,
  MessageSquare,
  Calendar,
  Tv,
  Wind,
  Wine
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomType {
  id: string;
  name: string;
  code: string;
  base_price: number;
  max_occupancy: number;
  description: string | null;
  amenities: string[] | null;
}

interface Review {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [staffSecretModalOpen, setStaffSecretModalOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState<string>("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const { data: propertySettings } = usePropertySettings();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("review") === "1") {
      setFeedbackModalOpen(true);
    }
  }, []);

  const applyPropertySettings = propertySettings?.apply_settings ?? true;
  const propertyName = applyPropertySettings
    ? propertySettings?.name || "HavenStay"
    : "HavenStay";
  const propertyAddress = applyPropertySettings
    ? [propertySettings?.address, propertySettings?.city]
        .filter(Boolean)
        .join(", ") || "123 Haven Street, City Center"
    : "123 Haven Street, City Center";
  const propertyPhone = applyPropertySettings
    ? propertySettings?.phone || "+254 700 123 456"
    : "+254 700 123 456";
  const propertyEmail = applyPropertySettings
    ? propertySettings?.email || "reservations@havenstay.com"
    : "reservations@havenstay.com";

  // Fetch room types and reviews from database
  useEffect(() => {
    const fetchData = async () => {
      // Fetch room types
      const { data: roomData } = await supabase
        .from("room_types")
        .select("*")
        .eq("is_active", true)
        .order("base_price");
      
      if (roomData) setRoomTypes(roomData);

      // Fetch approved reviews
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("id, guest_name, rating, comment, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (reviewData) setReviews(reviewData);
    };
    fetchData();
  }, []);

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, any> = {
      wifi: Wifi,
      ac: Wind,
      tv: Tv,
      minibar: Wine,
      balcony: Sparkles,
    };
    return icons[amenity.toLowerCase()] || Sparkles;
  };

  const getRoomImages = (code: string) => {
    const images: Record<string, string[]> = {
      basic: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=2400&h=1600&fit=crop",
      ],
      standard: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=2400&h=1600&fit=crop",
      ],
      superior: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1521783593447-5702b9bfd267?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=2400&h=1600&fit=crop",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=2400&h=1600&fit=crop",
      ],
    };
    return images[code] || images.basic;
  };

  const amenities = [
    { icon: Wifi, name: "High-Speed WiFi", description: "Complimentary throughout the property" },
    { icon: Car, name: "Free Parking", description: "Secure parking for all guests" },
    { icon: Coffee, name: "24/7 Room Service", description: "Delicious meals any time" },
    { icon: Utensils, name: "Restaurant & Bar", description: "Fine dining experience" },
    { icon: Shield, name: "24/7 Security", description: "Your safety is our priority" },
    { icon: Sparkles, name: "Daily Housekeeping", description: "Immaculate rooms every day" },
  ];

  // Default reviews if none in database
  const defaultReviews = [
    {
      id: "default-1",
      guest_name: "Sarah M.",
      rating: 5,
      comment: "Absolutely wonderful stay! The staff was incredibly friendly and the room was spotless. Will definitely come back!",
      created_at: "2026-01-15",
    },
    {
      id: "default-2",
      guest_name: "John K.",
      rating: 5,
      comment: "Best hotel in the area. The superior room exceeded all expectations. Highly recommend!",
      created_at: "2026-01-10",
    },
    {
      id: "default-3",
      guest_name: "Emily R.",
      rating: 4,
      comment: "Great location, excellent service. The breakfast was amazing. Perfect for business travelers.",
      created_at: "2025-12-20",
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  const formatReviewDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleBookRoom = (roomCode?: string) => {
    setPreselectedRoom(roomCode || "");
    setBookingModalOpen(true);
  };

  const openGallery = (roomName: string, images: string[], activeImage: string) => {
    if (images.length === 0) return;
    setGalleryTitle(roomName);
    setGalleryImages(images);
    const startIndex = Math.max(0, images.indexOf(activeImage));
    setGalleryIndex(startIndex);
    setGalleryOpen(true);
  };

  const handleNextImage = () => {
    if (galleryImages.length === 0) return;
    setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    if (galleryImages.length === 0) return;
    setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    if (!galleryOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") handleNextImage();
      if (event.key === "ArrowLeft") handlePrevImage();
      if (event.key === "Escape") setGalleryOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, galleryImages.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <BedDouble className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">{propertyName}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#rooms" className="text-sm font-medium hover:text-accent transition-colors">Rooms</a>
              <a href="#amenities" className="text-sm font-medium hover:text-accent transition-colors">Amenities</a>
              <a href="#reviews" className="text-sm font-medium hover:text-accent transition-colors">Reviews</a>
              <a href="#contact" className="text-sm font-medium hover:text-accent transition-colors">Contact</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLookupModalOpen(true)}>
                <Search className="h-4 w-4 mr-2" />
                My Booking
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-accent/30 hover:bg-accent/10"
                onClick={() => setStaffSecretModalOpen(true)}
              >
                Staff Login
              </Button>
              <Button onClick={() => handleBookRoom()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Book Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-accent/20">
              <div className="flex flex-col gap-4">
                <a href="#rooms" className="text-sm font-medium hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Rooms</a>
                <a href="#amenities" className="text-sm font-medium hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Amenities</a>
                <a href="#reviews" className="text-sm font-medium hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
                <a href="#contact" className="text-sm font-medium hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { setLookupModalOpen(true); setMobileMenuOpen(false); }}>
                  <Search className="h-4 w-4 mr-2" />
                  Check My Booking
                </Button>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-accent/30" 
                    size="sm"
                    onClick={() => { setStaffSecretModalOpen(true); setMobileMenuOpen(false); }}
                  >
                    Staff Login
                  </Button>
                  <Button className="flex-1 bg-accent text-accent-foreground" onClick={() => { handleBookRoom(); setMobileMenuOpen(false); }}>Book Now</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=7680&h=4320&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-background/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(218,165,32,0.35),transparent_55%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full border border-accent/30">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="text-sm font-medium text-primary-foreground">Rated 4.9/5 by our guests</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground">
                Your Perfect <span className="text-accent">Getaway</span> Awaits
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-lg">
                Experience luxury and comfort at {propertyName}. Modern rooms, exceptional service, 
                and unforgettable moments in the heart of the city.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleBookRoom()}>
                  Book Your Stay
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setLookupModalOpen(true)}>
                  <Search className="h-4 w-4" />
                  Check Booking Status
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-primary-foreground">25+</p>
                  <p className="text-sm text-primary-foreground/70">Luxury Rooms</p>
                </div>
                <div className="w-px h-12 bg-primary-foreground/30" />
                <div>
                  <p className="text-3xl font-bold text-primary-foreground">4.9</p>
                  <p className="text-sm text-primary-foreground/70">Guest Rating</p>
                </div>
                <div className="w-px h-12 bg-primary-foreground/30" />
                <div>
                  <p className="text-3xl font-bold text-primary-foreground">24/7</p>
                  <p className="text-sm text-primary-foreground/70">Support</p>
                </div>
              </div>
            </div>
            
            {/* Quick Booking Card */}
            <Card className="shadow-2xl border-accent/20 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Quick Reservation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Request a room reservation in just a few clicks. Our team will confirm availability promptly.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-5 w-5 text-accent" />
                      <span className="text-sm">{roomTypes.length} Room Types Available</span>
                    </div>
                  </div>
                  
                  {roomTypes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Starting from</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-primary">Ksh {Math.min(...roomTypes.map(r => r.base_price)).toLocaleString()}</span>
                        <span className="text-muted-foreground">/night</span>
                      </div>
                    </div>
                  )}
                </div>

                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={() => handleBookRoom()}>
                  Reserve Now
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Best rate guarantee • Pay at hotel
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Suites Gallery */}
      <FeaturedSuitesGallery onBookNow={() => handleBookRoom()} />

      {/* Rooms Section */}
      <section id="rooms" className="py-20 bg-muted/30 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(218,165,32,0.12),transparent_50%),radial-gradient(circle_at_10%_80%,rgba(15,23,42,0.08),transparent_55%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Our Rooms</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">
              Choose Your Perfect Stay
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From cozy basic rooms to luxurious superior suites, we have the perfect accommodation for every traveler.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {roomTypes.map((room) => (
              <Card key={room.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur-xl border-primary/10">
                <div className="relative p-3">
                  <div className="grid grid-cols-3 gap-2 h-56">
                    <div className="col-span-2 rounded-xl overflow-hidden">
                      <img 
                        src={getRoomImages(room.code)[0]} 
                        alt={`${room.name} main view`}
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-[1.03]"
                        onClick={() => openGallery(room.name, getRoomImages(room.code), getRoomImages(room.code)[0])}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex-1 rounded-xl overflow-hidden">
                        <img 
                          src={getRoomImages(room.code)[1]} 
                          alt={`${room.name} detail view`}
                          className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-[1.03]"
                          onClick={() => openGallery(room.name, getRoomImages(room.code), getRoomImages(room.code)[1])}
                        />
                      </div>
                      <div className="flex-1 rounded-xl overflow-hidden">
                        <img 
                          src={getRoomImages(room.code)[2]} 
                          alt={`${room.name} amenities view`}
                          className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-[1.03]"
                          onClick={() => openGallery(room.name, getRoomImages(room.code), getRoomImages(room.code)[2])}
                        />
                      </div>
                    </div>
                  </div>
                  <Badge className="absolute top-6 right-6 bg-primary/95 shadow-lg">
                    Ksh {room.base_price.toLocaleString()}/night
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Up to {room.max_occupancy} Guests
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities?.map((amenity, i) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <Badge key={i} variant="secondary" className="text-xs gap-1 capitalize">
                          <Icon className="h-3 w-3" />
                          {amenity}
                        </Badge>
                      );
                    })}
                  </div>

                  <Button className="w-full" onClick={() => handleBookRoom(room.code)}>
                    Book Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-20 bg-secondary/30 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1501117716987-c8e1ecb210dd?w=7680&h=4320&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-accent/30 text-accent">Amenities</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've thought of everything to make your stay comfortable and memorable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((amenity, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-accent/10 bg-background/85 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <amenity.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{amenity.name}</h3>
                    <p className="text-sm text-muted-foreground">{amenity.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505691723518-36a1e45c3d3f?w=7680&h=4320&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-accent/30 text-accent">Guest Reviews</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Guests Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Read genuine reviews from guests who've experienced {propertyName}.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review) => (
              <Card key={review.id} className="p-6 border-accent/10 bg-background/85 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-accent/20 mb-3" />
                <p className="text-muted-foreground mb-4">{review.comment}</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{review.guest_name}</p>
                  <p className="text-sm text-muted-foreground">{formatReviewDate(review.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => setFeedbackModalOpen(true)} className="gap-2 border-accent/30 hover:bg-accent/10">
              <MessageSquare className="h-4 w-4" />
              Share Your Experience
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-secondary/30 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505691723518-36a1e45c3d3f?w=7680&h=4320&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Badge variant="outline" className="mb-4 border-accent/30 text-accent">Contact Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get In Touch
              </h2>
              <p className="text-muted-foreground mb-8">
                Have questions or need assistance with your booking? Our team is here to help 24/7.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{propertyAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Phone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{propertyPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Mail className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{propertyEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Reception Hours</p>
                    <p className="text-muted-foreground">24 hours, 7 days a week</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-6 border-accent/10 bg-background/90 backdrop-blur-sm shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Send us a message</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input placeholder="John" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input placeholder="Doe" className="bg-background" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="john@example.com" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input placeholder="+254 700 123 456" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea placeholder="How can we help you?" rows={4} className="bg-background" />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90">Send Message</Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  <BedDouble className="h-5 w-5 text-accent-foreground" />
                </div>
                <span className="text-lg font-bold">{propertyName}</span>
              </div>
              <p className="text-sm text-primary-foreground/70">
                Your home away from home. Experience comfort and luxury at its finest.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><a href="#rooms" className="hover:text-accent">Our Rooms</a></li>
                <li><a href="#amenities" className="hover:text-accent">Amenities</a></li>
                <li><a href="#reviews" className="hover:text-accent">Reviews</a></li>
                <li><a href="#contact" className="hover:text-accent">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><button onClick={() => handleBookRoom()} className="hover:text-accent">Book a Room</button></li>
                <li><button onClick={() => setLookupModalOpen(true)} className="hover:text-accent">Check Booking</button></li>
                <li><button onClick={() => setFeedbackModalOpen(true)} className="hover:text-accent">Leave Review</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>Check-in: 2:00 PM</li>
                <li>Check-out: 11:00 AM</li>
                <li>Free cancellation</li>
                <li>Pet friendly</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-foreground/70">
              © 2026 {propertyName}. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-primary-foreground/70">
              <a href="#" className="hover:text-accent">Privacy Policy</a>
              <a href="#" className="hover:text-accent">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingRequestModal 
        open={bookingModalOpen} 
        onOpenChange={setBookingModalOpen} 
        roomTypes={roomTypes}
        preselectedRoom={preselectedRoom}
      />
      <ReservationLookupModal 
        open={lookupModalOpen} 
        onOpenChange={setLookupModalOpen} 
      />
      <FeedbackModal 
        open={feedbackModalOpen} 
        onOpenChange={setFeedbackModalOpen} 
      />
      <StaffSecretModal
        open={staffSecretModalOpen}
        onOpenChange={setStaffSecretModalOpen}
      />
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-6xl bg-background/95 backdrop-blur-xl border-primary/10">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-3">
              <div
                className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted"
                onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
                onTouchEnd={(event) => {
                  if (touchStartX === null) return;
                  const endX = event.changedTouches[0]?.clientX ?? touchStartX;
                  const delta = touchStartX - endX;
                  if (Math.abs(delta) > 50) {
                    if (delta > 0) {
                      handleNextImage();
                    } else {
                      handlePrevImage();
                    }
                  }
                  setTouchStartX(null);
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                  onClick={handlePrevImage}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
                <img
                  src={galleryImages[galleryIndex]}
                  alt={galleryTitle}
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {galleryTitle} — curated luxury details and elevated comfort.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Room Gallery</p>
                  <h3 className="text-xl font-semibold">{galleryTitle}</h3>
                </div>
                <Badge variant="outline">{galleryImages.length} Photos</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className={cn(
                      "relative rounded-xl overflow-hidden border transition-all",
                      galleryIndex === index ? "border-primary shadow-lg" : "border-border hover:border-primary/60"
                    )}
                    onClick={() => setGalleryIndex(index)}
                  >
                    <img src={img} alt={`${galleryTitle} ${index + 1}`} className="w-full h-24 object-cover" />
                  </button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Tap any image to expand. High‑resolution photos showcase the full suite experience.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
