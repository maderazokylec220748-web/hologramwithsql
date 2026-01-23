import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  eventEndDate?: Date;
  location: string;
  department?: string;
  organizer?: string;
  eventType: string;
  capacity?: number;
  image?: string;
  isActive: boolean;
}

const EVENT_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  academic: { label: "Academic", color: "bg-blue-100 text-blue-800", icon: "📚" },
  seminar: { label: "Seminar", color: "bg-purple-100 text-purple-800", icon: "🎓" },
  workshop: { label: "Workshop", color: "bg-green-100 text-green-800", icon: "🛠️" },
  sports: { label: "Sports", color: "bg-red-100 text-red-800", icon: "⚽" },
  special: { label: "Special", color: "bg-yellow-100 text-yellow-800", icon: "🌟" },
  student_org: { label: "Student Org", color: "bg-pink-100 text-pink-800", icon: "👥" },
  competition: { label: "Competition", color: "bg-orange-100 text-orange-800", icon: "🏆" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800", icon: "📌" },
};

export function EventsDisplay() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
    retry: false,
    refetchOnMount: true,
    refetchInterval: 60000, // Refresh every minute for kiosk
  });

  const formatEventDate = (date: Date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  const isEventHappening = (event: Event) => {
    const now = new Date();
    const eventStart = new Date(event.eventDate);
    const eventEnd = event.eventEndDate ? new Date(event.eventEndDate) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);
    return now >= eventStart && now <= eventEnd;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-8 text-center">
          <Zap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Upcoming Events</h3>
          <p className="text-slate-600">Check back soon for exciting activities!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">📅 Upcoming Events</h2>
        <p className="text-slate-600">Stay updated with school activities</p>
      </div>

      {events.map((event, index) => {
        const dateInfo = formatEventDate(event.eventDate);
        const happening = isEventHappening(event);
        const eventTypeInfo = EVENT_TYPES[event.eventType] || EVENT_TYPES.other;

        return (
          <Card
            key={event.id}
            className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 ${
              happening ? "border-l-red-500 bg-red-50 shadow-lg ring-2 ring-red-300" : "border-l-slate-300"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Event Number / Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                      happening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {eventTypeInfo.icon}
                  </div>
                  {happening && (
                    <div className="text-center mt-2">
                      <Badge className="bg-red-500 text-white text-xs">NOW</Badge>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 break-words">{event.title}</h3>
                      <Badge className={`mt-2 ${eventTypeInfo.color} text-xs font-semibold`}>
                        {eventTypeInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-slate-700 mb-4 leading-relaxed">{event.description}</p>

                  {/* Event Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {/* Date and Time */}
                    <div className="flex items-start gap-3 p-3 bg-slate-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{dateInfo.date}</p>
                        <p className="text-sm text-slate-700">{dateInfo.time}</p>
                        {event.eventEndDate && (
                          <p className="text-xs text-slate-600 mt-1">
                            to {formatEventDate(event.eventEndDate).time}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3 p-3 bg-slate-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 break-words">{event.location}</p>
                        {event.department && (
                          <p className="text-sm text-slate-700">{event.department}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-3">
                    {event.organizer && (
                      <div className="px-3 py-1 bg-slate-200 rounded-full text-sm text-slate-800 font-medium">
                        👥 {event.organizer}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="px-3 py-1 bg-slate-200 rounded-full text-sm text-slate-800 font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.capacity} seats
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="text-center py-4 text-sm text-slate-500">
        Showing {events.length} upcoming event{events.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
