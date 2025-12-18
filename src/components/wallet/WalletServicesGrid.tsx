import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  User,
  Building2,
  ArrowUpRight,
  Phone,
  Smartphone,
  Tv,
  Lock,
  Lightbulb,
  Gift,
  Plus,
  Heart,
} from "lucide-react";
import { useServiceFavorites } from "@/hooks/useServiceFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { serviceFavoritesService } from "@/services/serviceFavoritesService";

interface Service {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  gradient: string;
  iconColor: string;
  badge?: {
    text: string;
    variant: "hot" | "popular" | "new";
  };
}

// Default 7 favorite services
const DEFAULT_FAVORITES = [
  "airtime",
  "data",
  "electricity",
  "tv",
  "safebox",
  "deposit",
  "pay-bills",
];

const WalletServicesGrid = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, isFavorited, toggleFavorite, refresh } = useServiceFavorites();

  // Initialize default favorites on first load
  useEffect(() => {
    const initializeDefaults = async () => {
      if (user?.id && favorites.length === 0) {
        try {
          // Check if user has any favorites set
          const existingFavorites = await serviceFavoritesService.getFavorites(user.id);

          // If no favorites exist, add the default ones
          if (existingFavorites.length === 0) {
            for (const serviceId of DEFAULT_FAVORITES) {
              await serviceFavoritesService.addFavorite(user.id, serviceId);
            }
            await refresh();
          }
        } catch (error) {
          console.error("Error initializing default favorites:", error);
        }
      }
    };

    initializeDefaults();
  }, [user?.id, favorites.length, refresh]);

  // All available services
  const allServices: Record<string, Service> = {
    "to-eloity": {
      id: "to-eloity",
      label: "To Eloity",
      icon: <User className="h-6 w-6" />,
      action: () => navigate("/app/wallet/send-to-eloity"),
      gradient: "bg-gradient-to-br from-teal-400 to-cyan-500",
      iconColor: "text-white",
    },
    "transfer": {
      id: "transfer",
      label: "Transfer",
      icon: <Building2 className="h-6 w-6" />,
      action: () => navigate("/app/wallet/transfer"),
      gradient: "bg-gradient-to-br from-green-400 to-emerald-500",
      iconColor: "text-white",
    },
    "withdraw": {
      id: "withdraw",
      label: "Withdraw",
      icon: <ArrowUpRight className="h-6 w-6" />,
      action: () => navigate("/app/wallet/withdraw"),
      gradient: "bg-gradient-to-br from-purple-400 to-blue-500",
      iconColor: "text-white",
    },
    "airtime": {
      id: "airtime",
      label: "Airtime",
      icon: <Phone className="h-6 w-6" />,
      action: () => navigate("/app/wallet/airtime"),
      gradient: "bg-gradient-to-br from-orange-400 to-red-500",
      iconColor: "text-white",
      badge: { text: "Up to 6%", variant: "hot" },
    },
    "data": {
      id: "data",
      label: "Data",
      icon: <Smartphone className="h-6 w-6" />,
      action: () => navigate("/app/wallet/data"),
      gradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
      iconColor: "text-white",
    },
    "electricity": {
      id: "electricity",
      label: "Electricity",
      icon: <Lightbulb className="h-6 w-6" />,
      action: () => navigate("/app/wallet/electricity"),
      gradient: "bg-gradient-to-br from-yellow-400 to-orange-500",
      iconColor: "text-white",
    },
    "tv": {
      id: "tv",
      label: "TV",
      icon: <Tv className="h-6 w-6" />,
      action: () => navigate("/app/wallet/tv"),
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
      iconColor: "text-white",
    },
    "safebox": {
      id: "safebox",
      label: "Safebox",
      icon: <Lock className="h-6 w-6" />,
      action: () => navigate("/app/wallet/safebox"),
      gradient: "bg-gradient-to-br from-teal-400 to-green-500",
      iconColor: "text-white",
    },
    "deposit": {
      id: "deposit",
      label: "Deposit",
      icon: <Plus className="h-6 w-6" />,
      action: () => navigate("/app/wallet/deposit"),
      gradient: "bg-gradient-to-br from-cyan-400 to-teal-500",
      iconColor: "text-white",
    },
    "pay-bills": {
      id: "pay-bills",
      label: "Pay Bills",
      icon: <Lightbulb className="h-6 w-6" />,
      action: () => navigate("/app/wallet/pay-bills"),
      gradient: "bg-gradient-to-br from-blue-400 to-purple-500",
      iconColor: "text-white",
    },
    "more": {
      id: "more",
      label: "More",
      icon: <Gift className="h-6 w-6" />,
      action: () => navigate("/app/wallet/more-services"),
      gradient: "bg-gradient-to-br from-gray-400 to-gray-500",
      iconColor: "text-white",
    },
  };

  // Get favorite services in order (excluding the "more" service)
  const favoriteServiceIds = new Set(
    favorites
      .map(fav => fav.serviceId)
      .filter(id => id !== 'more')
  );

  // Row 1: Fixed transfer services (3 items)
  const row1Services = ['to-eloity', 'transfer', 'withdraw'].map(id => allServices[id]);

  // Rows 2-3: Favorite services (7 items max) + More button
  const favoriteServices: Service[] = [];
  const addedServiceIds = new Set<string>();

  // First, add all user favorites
  for (const serviceId of favoriteServiceIds) {
    if (allServices[serviceId] && !addedServiceIds.has(serviceId)) {
      favoriteServices.push(allServices[serviceId]);
      addedServiceIds.add(serviceId);
    }
  }

  // Then, pad with defaults if needed
  for (const defaultId of DEFAULT_FAVORITES) {
    if (favoriteServices.length >= 7) break;
    if (!addedServiceIds.has(defaultId) && allServices[defaultId]) {
      favoriteServices.push(allServices[defaultId]);
      addedServiceIds.add(defaultId);
    }
  }

  // Add "More" button as the 8th item
  const row2And3Services = [...favoriteServices.slice(0, 7), allServices['more']];


  const ServiceCard = ({ service, showFavoriteToggle = false }: { service: Service; showFavoriteToggle?: boolean }) => {
    const isFav = isFavorited(service.id);

    return (
      <div className="relative group flex flex-col items-center gap-3 p-4 sm:p-5 w-full">
        {/* Favorite Toggle Button - Only for non-fixed services */}
        {showFavoriteToggle && service.id !== 'more' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(service.id);
            }}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFav
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400"
              }`}
            />
          </button>
        )}

        {/* Service Button */}
        <button
          onClick={service.action}
          className="w-full flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Icon Container with gradient background */}
          <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all duration-300 group-hover:shadow-xl ${service.gradient}`}>
            <div className={service.iconColor}>
              {service.icon}
            </div>

            {/* Badge */}
            {service.badge && (
              <div
                className={`absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${
                  service.badge.variant === "hot"
                    ? "bg-red-600"
                    : service.badge.variant === "popular"
                    ? "bg-amber-600"
                    : "bg-blue-600"
                }`}
              >
                {service.badge.text}
              </div>
            )}
          </div>

          {/* Label */}
          <div className="text-center w-full">
            <p className="font-semibold text-gray-800 text-sm sm:text-base leading-tight">{service.label}</p>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Services Grid */}
      <div className="space-y-6">
        {/* Row 1: Fixed Services (To Eloity, Transfer, Withdraw) - 3 items */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {row1Services.map((service) => (
            <ServiceCard key={service.id} service={service} showFavoriteToggle={false} />
          ))}
        </div>

        {/* Row 2: Favorite Services (4 items) */}
        <div className="grid grid-cols-4 gap-4 sm:gap-6">
          {row2And3Services.slice(0, 4).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              showFavoriteToggle={service.id !== 'more'}
            />
          ))}
        </div>

        {/* Row 3: Favorite Services (4 items) */}
        <div className="grid grid-cols-4 gap-4 sm:gap-6">
          {row2And3Services.slice(4, 8).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              showFavoriteToggle={service.id !== 'more'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletServicesGrid;
