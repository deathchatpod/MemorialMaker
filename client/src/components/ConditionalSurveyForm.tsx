import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Question } from "@shared/schema";

interface ConditionalSurveyFormProps {
  questions: Question[];
  onSubmit: (formData: Record<string, any>) => void;
  isLoading?: boolean;
  userType?: string;
}

export default function ConditionalSurveyForm({ questions, onSubmit, isLoading = false, userType }: ConditionalSurveyFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<number[]>([]);

  // Sort questions by order index
  const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  // Determine which questions should be visible based on conditional logic
  useEffect(() => {
    const visible: number[] = [];
    
    sortedQuestions.forEach(question => {
      let shouldShow = true;
      
      // Check if this question has conditional logic
      if (question.conditionalQuestionId && question.conditionalValue) {
        const conditionalAnswer = formData[question.conditionalQuestionId];
        
        if (!conditionalAnswer) {
          shouldShow = false;
        } else {
          switch (question.conditionalOperator) {
            case 'equals':
              if (Array.isArray(conditionalAnswer)) {
                shouldShow = conditionalAnswer.includes(question.conditionalValue);
              } else {
                shouldShow = conditionalAnswer === question.conditionalValue;
              }
              break;
            case 'contains':
              if (Array.isArray(conditionalAnswer)) {
                shouldShow = conditionalAnswer.some(val => val.includes(question.conditionalValue));
              } else {
                shouldShow = conditionalAnswer.includes(question.conditionalValue);
              }
              break;
            case 'not_equals':
              if (Array.isArray(conditionalAnswer)) {
                shouldShow = !conditionalAnswer.includes(question.conditionalValue);
              } else {
                shouldShow = conditionalAnswer !== question.conditionalValue;
              }
              break;
            default:
              shouldShow = true;
          }
        }
      }
      
      if (shouldShow) {
        visible.push(question.id);
      }
    });
    
    setVisibleQuestions(visible);
  }, [formData, sortedQuestions]);

  const handleInputChange = (questionId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: number, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter((val: string) => val !== option)
        };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderQuestion = (question: Question) => {
    if (!visibleQuestions.includes(question.id)) {
      return null;
    }

    const value = formData[question.id] || '';

    switch (question.questionType) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`question-${question.id}`}
              type={question.questionType}
              placeholder={question.placeholder || ''}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.isRequired}
            />
          </div>
        );

      case 'number':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`question-${question.id}`}
              type="number"
              placeholder={question.placeholder || ''}
              value={value}
              onChange={(e) => handleInputChange(question.id, parseInt(e.target.value) || '')}
              required={question.isRequired}
            />
          </div>
        );

      case 'date':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`question-${question.id}`}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.isRequired}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={`question-${question.id}`}
              placeholder={question.placeholder || ''}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.isRequired}
              rows={3}
            />
          </div>
        );

      case 'radio':
        const radioOptions = Array.isArray(question.options) ? question.options : [];
        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(newValue) => handleInputChange(question.id, newValue)}
              required={question.isRequired}
            >
              {radioOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        const checkboxOptions = Array.isArray(question.options) ? question.options : [];
        const selectedValues = formData[question.id] || [];
        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {checkboxOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => handleCheckboxChange(question.id, option, !!checked)}
                  />
                  <Label htmlFor={`${question.id}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'select':
        const selectOptions = Array.isArray(question.options) ? question.options : [];
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleInputChange(question.id, newValue)}
              required={question.isRequired}
            >
              <SelectTrigger>
                <SelectValue placeholder={question.placeholder || 'Select an option...'} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-sm font-medium">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`question-${question.id}`}
              type="text"
              placeholder={question.placeholder || ''}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              required={question.isRequired}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {userType && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <Label className="text-base font-medium">Responding as: {userType}</Label>
          <p className="text-sm text-gray-500 mt-1">
            Use the header dropdown to switch between user types for testing
          </p>
        </div>
      )}
      
      {sortedQuestions.map(renderQuestion)}
      
      <div className="pt-4">
        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Submitting..." : "Submit Survey"}
        </Button>
      </div>
    </form>
  );
}