import { useState } from "react";
import { ArrowLeft, BookOpen, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { EventsDisplay } from "@/components/hologram/EventsDisplay";
import logoImage from "@assets/westmead-removebg-preview_1760715284367.png";

type InfoTab = "events" | "professors" | "facilities";

export default function SchoolInfo() {
  const [activeTab, setActiveTab] = useState<InfoTab>("events");

  const tabConfig = [
    {
      id: "events" as InfoTab,
      label: "📅 Events",
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      id: "professors" as InfoTab,
      label: "👨‍🏫 Professors",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      id: "facilities" as InfoTab,
      label: "🏢 Facilities",
      icon: Building2,
      color: "text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-[hsl(0,75%,25%)] border-b border-[hsl(48,100%,50%)] px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Westmead" className="h-10 sm:h-12" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold">School Information</h1>
            <p className="text-xs sm:text-sm text-slate-300">Westmead International School</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)] hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur px-3 sm:px-6 flex overflow-x-auto sticky top-0 z-40">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <EventsDisplay />
              </motion.div>
            )}

            {activeTab === "professors" && (
              <motion.div
                key="professors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-4">👨‍🏫 Faculty Members</h2>
                  <p className="text-slate-300 mb-6">
                    Meet our experienced faculty members dedicated to educational excellence.
                  </p>
                </div>
                {/* Professors will be fetched and displayed here */}
                <Card className="p-6 bg-slate-800 border-slate-700 text-center">
                  <p className="text-slate-400">Professors directory coming soon...</p>
                </Card>
              </motion.div>
            )}

            {activeTab === "facilities" && (
              <motion.div
                key="facilities"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-4">🏢 Campus Facilities</h2>
                  <p className="text-slate-300 mb-6">
                    Explore our world-class facilities designed to support student success.
                  </p>
                </div>
                {/* Facilities will be fetched and displayed here */}
                <Card className="p-6 bg-slate-800 border-slate-700 text-center">
                  <p className="text-slate-400">Facilities directory coming soon...</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-800/50 px-6 py-4 text-center text-sm text-slate-400">
        <p>For more information, ask our AI Assistant or visit our main office</p>
      </div>
    </div>
  );
}
