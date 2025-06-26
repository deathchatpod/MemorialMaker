import React, { useState, useEffect, useMemo } from 'react';
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
  currentUser?: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  onUserUpdate?: (userData: any) => void;
}

export default function ConditionalSurveyForm({ 
  questions, 
  onSubmit, 
  isLoading = false, 
  userType, 
  currentUser,
  onUserUpdate 
}: ConditionalSurveyFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<number[]>([]);

  // Sort questions by order index (memoize to prevent re-creation)
  const sortedQuestions = useMemo(() => 
    [...questions].sort((a, b) => a.orderIndex - b.orderIndex), 
    [questions]
  );

  // Memoize visible questions calculation to prevent unnecessary re-renders
  const visibleQuestionIds = useMemo(() => {
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
    
    return visible;
  }, [formData, sortedQuestions]);

  // Update visible questions when calculation changes
  useEffect(() => {
    setVisibleQuestions(visibleQuestionIds);
  }, [visibleQuestionIds]);

  const handleInputChange = (questionId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Auto-fill user information when "Yourself" is selected
    const question = sortedQuestions.find(q => q.id === questionId);
    if (question?.questionText === "Are you filling out this form for:" && value === "Yourself" && currentUser) {
      const autoFillData: Record<number, any> = {};
      
      // Map user data to question IDs based on question text
      sortedQuestions.forEach(q => {
        if (q.questionText === "Email Address:" && currentUser.email) {
          autoFillData[q.id] = currentUser.email;
        } else if (q.questionText === "Phone Number:" && currentUser.phone) {
          autoFillData[q.id] = currentUser.phone;
        } else if (q.questionText === "Street Address:" && currentUser.address) {
          autoFillData[q.id] = currentUser.address;
        } else if (q.questionText === "City:" && currentUser.city) {
          autoFillData[q.id] = currentUser.city;
        } else if (q.questionText === "State:" && currentUser.state) {
          autoFillData[q.id] = currentUser.state;
        } else if (q.questionText === "Zip Code:" && currentUser.zipCode) {
          autoFillData[q.id] = currentUser.zipCode;
        }
      });

      if (Object.keys(autoFillData).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...autoFillData
        }));
      }
    }
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
    
    // Extract user information to update account if "Yourself" was selected
    const yourselfQuestion = sortedQuestions.find(q => q.questionText === "Are you filling out this form for:");
    if (yourselfQuestion && formData[yourselfQuestion.id] === "Yourself" && onUserUpdate && currentUser) {
      const updatedUserData: any = { id: currentUser.id };
      
      // Extract new information from form data
      sortedQuestions.forEach(q => {
        const value = formData[q.id];
        if (value) {
          if (q.questionText === "Email Address:") {
            updatedUserData.email = value;
          } else if (q.questionText === "Phone Number:") {
            updatedUserData.phone = value;
          } else if (q.questionText === "Street Address:") {
            updatedUserData.address = value;
          } else if (q.questionText === "City:") {
            updatedUserData.city = value;
          } else if (q.questionText === "State:") {
            updatedUserData.state = value;
          } else if (q.questionText === "Zip Code:") {
            updatedUserData.zipCode = value;
          }
        }
      });

      // Only update if there are changes
      const hasChanges = Object.keys(updatedUserData).some(key => 
        key !== 'id' && updatedUserData[key] !== currentUser[key as keyof typeof currentUser]
      );

      if (hasChanges && onUserUpdate) {
        onUserUpdate(updatedUserData);
      }
    }
    
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
              {radioOptions.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                return (
                  <div key={`${question.id}-${index}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={optionValue} id={`${question.id}-${optionValue}`} />
                    <Label htmlFor={`${question.id}-${optionValue}`} className="text-sm">
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
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
              {checkboxOptions.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                return (
                  <div key={`${question.id}-${index}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${question.id}-${optionValue}`}
                      checked={selectedValues.includes(optionValue)}
                      onCheckedChange={(checked) => handleCheckboxChange(question.id, optionValue, !!checked)}
                    />
                    <Label htmlFor={`${question.id}-${optionValue}`} className="text-sm">
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
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
                {selectOptions.map((option, index) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object' ? option.label : option;
                  return (
                    <SelectItem key={`${question.id}-${index}`} value={optionValue}>
                      {optionLabel}
                    </SelectItem>
                  );
                })}
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
      {sortedQuestions.map(renderQuestion)}
      
      <div className="pt-4">
        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Submitting..." : "Submit Survey"}
        </Button>
      </div>
    </form>
  );
}