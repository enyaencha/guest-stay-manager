import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rooms = [
    {
      name: "Standard Room",
      description: "Comfortable and cozy for solo travelers or couples",
      price: 3500,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
      amenities: ["Queen Bed", "Free WiFi", "TV", "Air Conditioning"],
      size: "22 sqm",
      occupancy: 2,
    },
    {
      name: "Deluxe Room",
      description: "Spacious room with city views and premium amenities",
      price: 5500,
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop",
      amenities: ["King Bed", "City View", "Mini Bar", "Work Desk"],
      size: "32 sqm",
      occupancy: 2,
    },
    {
      name: "Executive Suite",
      description: "Luxury suite with separate living area and premium service",
      price: 8500,
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop",
      amenities: ["King Bed", "Living Area", "Jacuzzi", "Butler Service"],
      size: "48 sqm",
      occupancy: 3,
    },
  ];

  const amenities = [
    { icon: Wifi, name: "High-Speed WiFi", description: "Complimentary throughout the property" },
    { icon: Car, name: "Free Parking", description: "Secure parking for all guests" },
    { icon: Coffee, name: "24/7 Room Service", description: "Delicious meals any time" },
    { icon: Utensils, name: "Restaurant & Bar", description: "Fine dining experience" },
    { icon: Shield, name: "24/7 Security", description: "Your safety is our priority" },
    { icon: Sparkles, name: "Daily Housekeeping", description: "Immaculate rooms every day" },
  ];

  const reviews = [
    {
      name: "Sarah M.",
      rating: 5,
      comment: "Absolutely wonderful stay! The staff was incredibly friendly and the room was spotless. Will definitely come back!",
      date: "January 2026",
    },
    {
      name: "John K.",
      rating: 5,
      comment: "Best hotel in the area. The executive suite exceeded all expectations. Highly recommend!",
      date: "January 2026",
    },
    {
      name: "Emily R.",
      rating: 4,
      comment: "Great location, excellent service. The breakfast was amazing. Perfect for business travelers.",
      date: "December 2025",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <BedDouble className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">HavenStay</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#rooms" className="text-sm font-medium hover:text-primary transition-colors">Rooms</a>
              <a href="#amenities" className="text-sm font-medium hover:text-primary transition-colors">Amenities</a>
              <a href="#reviews" className="text-sm font-medium hover:text-primary transition-colors">Reviews</a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="outline">Staff Login</Button>
              </Link>
              <Button>Book Now</Button>
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
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-4">
                <a href="#rooms" className="text-sm font-medium hover:text-primary">Rooms</a>
                <a href="#amenities" className="text-sm font-medium hover:text-primary">Amenities</a>
                <a href="#reviews" className="text-sm font-medium hover:text-primary">Reviews</a>
                <a href="#contact" className="text-sm font-medium hover:text-primary">Contact</a>
                <div className="flex gap-2 pt-2">
                  <Link to="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full">Staff Login</Button>
                  </Link>
                  <Button className="flex-1">Book Now</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-medium">Rated 4.9/5 by our guests</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Your Perfect <span className="text-primary">Getaway</span> Awaits
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Experience luxury and comfort at HavenStay. Modern rooms, exceptional service, 
                and unforgettable moments in the heart of the city.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2">
                  Book Your Stay
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Us
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold">25+</p>
                  <p className="text-sm text-muted-foreground">Luxury Rooms</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-bold">4.9</p>
                  <p className="text-sm text-muted-foreground">Guest Rating</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="text-sm text-muted-foreground">Support</p>
                </div>
              </div>
            </div>
            
            {/* Quick Booking Card */}
            <Card className="shadow-xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Quick Reservation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Check In</label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Check Out</label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Guests</label>
                    <Input type="number" min="1" max="10" defaultValue="2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rooms</label>
                    <Input type="number" min="1" max="5" defaultValue="1" />
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  Check Availability
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Best rate guarantee • Free cancellation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Our Rooms</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Perfect Stay
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From cozy standard rooms to luxurious suites, we have the perfect accommodation for every traveler.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img 
                    src={room.image} 
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3 bg-primary">
                    From Ksh {room.price.toLocaleString()}/night
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {room.occupancy} Guests
                    </span>
                    <span>{room.size}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.map((amenity, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full">
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
      <section id="amenities" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Amenities</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've thought of everything to make your stay comfortable and memorable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((amenity, index) => (
              <Card key={index} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <amenity.icon className="h-6 w-6 text-primary" />
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
      <section id="reviews" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Guest Reviews</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Guests Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Read genuine reviews from guests who've experienced HavenStay.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-4">{review.comment}</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.date}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Badge variant="outline" className="mb-4">Contact Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get In Touch
              </h2>
              <p className="text-muted-foreground mb-8">
                Have questions or need assistance with your booking? Our team is here to help 24/7.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">123 Haven Street, City Center</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">+254 700 123 456</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">reservations@havenstay.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Reception Hours</p>
                    <p className="text-muted-foreground">24 hours, 7 days a week</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Send us a message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input type="tel" placeholder="+254 700 000 000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea placeholder="How can we help you?" rows={4} />
                </div>
                <Button className="w-full">Send Message</Button>
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
                <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                  <BedDouble className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">HavenStay</span>
              </div>
              <p className="text-primary-foreground/80 text-sm">
                Your home away from home. Experience luxury, comfort, and exceptional service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><a href="#rooms" className="hover:text-primary-foreground">Rooms</a></li>
                <li><a href="#amenities" className="hover:text-primary-foreground">Amenities</a></li>
                <li><a href="#reviews" className="hover:text-primary-foreground">Reviews</a></li>
                <li><a href="#contact" className="hover:text-primary-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><a href="#" className="hover:text-primary-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Cancellation Policy</a></li>
                <li><a href="#" className="hover:text-primary-foreground">House Rules</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>123 Haven Street</li>
                <li>City Center</li>
                <li>+254 700 123 456</li>
                <li>reservations@havenstay.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
            © 2026 HavenStay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
