import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Building2, Award, Calendar, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onActionClick: (question: string) => void;
}

const actions = [
  {
    icon: GraduationCap,
    title: "Admissions",
    question: "How do I apply to Westmead International School?",
    gradient: "from-[hsl(48,100%,50%)] to-[hsl(45,90%,40%)]",
  },
  {
    icon: BookOpen,
    title: "Programs",
    question: "What programs and courses does Westmead offer?",
    gradient: "from-[hsl(0,75%,35%)] to-[hsl(0,75%,25%)]",
  },
  {
    icon: Building2,
    title: "Facilities",
    question: "Tell me about Westmead's campus and facilities",
    gradient: "from-[hsl(48,100%,50%)] to-[hsl(45,90%,40%)]",
  },
  {
    icon: Calendar,
    title: "Events",
    question: "What are the upcoming events at Westmead?",
    gradient: "from-[hsl(0,75%,35%)] to-[hsl(0,75%,25%)]",
  },
  {
    icon: Award,
    title: "Scholarships",
    question: "What scholarships are available at Westmead?",
    gradient: "from-[hsl(48,100%,50%)] to-[hsl(45,90%,40%)]",
  },
];

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const [customInput, setCustomInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onActionClick(customInput.trim());
      setCustomInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              onClick={() => onActionClick(action.question)}
              className={`h-24 sm:h-32 cursor-pointer bg-gradient-to-br ${action.gradient} hover-elevate active-elevate-2 border-[hsl(48,100%,50%)] transition-all`}
              data-testid={`button-quick-action-${action.title.toLowerCase()}`}
            >
              <div className="flex flex-col items-center justify-center h-full p-2 sm:p-4 text-center">
                <action.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-white" />
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  {action.title}
                </h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Custom inquiry input */}
      <div className="border-t-2 border-[hsl(48,100%,50%)] bg-[hsl(0,60%,8%)] p-3 sm:p-6 mt-auto relative z-50">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 h-12 sm:h-16 bg-[hsl(0,70%,20%)] border-2 border-[hsl(48,100%,50%)] text-[hsl(45,30%,98%)] placeholder:text-[hsl(45,20%,65%)] text-base sm:text-xl px-3 sm:px-6 focus-visible:ring-2 focus-visible:ring-[hsl(48,100%,50%)]"
            data-testid="input-custom-inquiry"
          />
          <Button
            type="submit"
            size="lg"
            disabled={!customInput.trim()}
            className="h-12 sm:h-16 px-4 sm:px-8 bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)] text-base sm:text-lg font-bold"
            data-testid="button-send-custom-inquiry"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </form>
      </div>
    </div>
  );
}
