import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingStep } from "@/types/booking";

interface StepIndicatorProps {
  steps: BookingStep[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                step.isComplete && "bg-status-available border-status-available text-white",
                step.isCurrent && "bg-primary border-primary text-primary-foreground",
                !step.isComplete && !step.isCurrent && "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {step.isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={cn(
                "text-xs font-medium",
                (step.isComplete || step.isCurrent) ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "flex-1 h-0.5 mx-2 mt-[-1rem]",
                step.isComplete ? "bg-status-available" : "bg-muted"
              )} 
            />
          )}
        </div>
      ))}
    </div>
  );
}
