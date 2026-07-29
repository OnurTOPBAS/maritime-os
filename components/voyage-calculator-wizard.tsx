"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Ship, Route, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VoyageCalculatorStep1 } from "@/components/voyage-calculator-step1"
import { VoyageCalculatorStep2 } from "@/components/voyage-calculator-step2"
import { Skeleton } from "@/components/ui/skeleton"

interface VoyageCalculatorWizardProps {
  calculationId: string
}

export function VoyageCalculatorWizard({ calculationId }: VoyageCalculatorWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [calculation, setCalculation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const steps = [
    { number: 1, title: "Temel Bilgiler", icon: Ship, description: "Gemi ve kiracı bilgileri" },
    { number: 2, title: "Rota Bacakları", icon: Route, description: "Liman ve mesafe bilgileri" },
    { number: 3, title: "Maliyetler & Gelirler", icon: DollarSign, description: "Finansal detaylar" },
    { number: 4, title: "Özet", icon: FileText, description: "Hesaplama sonuçları" },
  ]

  useEffect(() => {
    fetchCalculation()
  }, [calculationId])

  const fetchCalculation = async () => {
    try {
      const response = await fetch(`/api/voyage-calculator/${calculationId}`)
      if (response.ok) {
        const data = await response.json()
        setCalculation(data)
      }
    } catch (error) {
      console.error("Error fetching calculation:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepComplete = () => {
    fetchCalculation()
    handleNext()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const progress = (currentStep / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/voyage-calculator")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{calculation?.calculation_number || "Yeni Hesaplama"}</h1>
          <p className="text-sm text-muted-foreground">
            Adım {currentStep} / {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <Progress value={progress} className="mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  step.number === currentStep
                    ? "bg-primary/10 text-primary"
                    : step.number < currentStep
                      ? "bg-green-50 text-green-600"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    step.number === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.number < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-muted-foreground/20"
                  }`}
                >
                  {step.number < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-[10px] text-muted-foreground hidden md:block">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <VoyageCalculatorStep1
              calculationId={calculationId}
              calculation={calculation}
              onComplete={handleStepComplete}
            />
          )}
          {currentStep === 2 && (
            <VoyageCalculatorStep2
              calculationId={calculationId}
              calculation={calculation}
              onComplete={handleStepComplete}
            />
          )}
          {currentStep === 3 && <div className="text-center py-12 text-muted-foreground">Yakında...</div>}
          {currentStep === 4 && <div className="text-center py-12 text-muted-foreground">Yakında...</div>}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Önceki
        </Button>
        <Button onClick={handleNext} disabled={currentStep === steps.length}>
          Sonraki
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
