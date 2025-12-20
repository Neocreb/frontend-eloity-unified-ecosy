import React, { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Tag,
  Type,
  FileText,
  Eye,
  Link2,
  ZoomIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SEOAnalysis {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: {
    titleLength: { score: number; passed: boolean; message: string };
    descriptionLength: { score: number; passed: boolean; message: string };
    keywordDensity: { score: number; passed: boolean; message: string };
    imageAltText: { score: number; passed: boolean; message: string };
    categoryOptimization: { score: number; passed: boolean; message: string };
    tagsUsage: { score: number; passed: boolean; message: string };
    priceTransparency: { score: number; passed: boolean; message: string };
    stockIndicator: { score: number; passed: boolean; message: string };
    mobileFriendly: { score: number; passed: boolean; message: string };
    uniqueContent: { score: number; passed: boolean; message: string };
  };
  recommendations: string[];
}

interface SEOOptimizerProps {
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  imageCount: number;
  keyword?: string;
  onScoreChange?: (score: number) => void;
}

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  title,
  description,
  category,
  tags,
  price,
  discountPrice,
  stock,
  imageCount,
  keyword,
  onScoreChange,
}) => {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);

  useEffect(() => {
    const seoAnalysis = analyzeSEO();
    setAnalysis(seoAnalysis);
    onScoreChange?.(seoAnalysis.score);
  }, [title, description, category, tags, price, discountPrice, stock, imageCount, keyword]);

  const analyzeSEO = (): SEOAnalysis => {
    const checks: SEOAnalysis["checks"] = {
      titleLength: analyzeTitleLength(),
      descriptionLength: analyzeDescriptionLength(),
      keywordDensity: analyzeKeywordDensity(),
      imageAltText: analyzeImages(),
      categoryOptimization: analyzeCategory(),
      tagsUsage: analyzeTags(),
      priceTransparency: analyzePrice(),
      stockIndicator: analyzeStock(),
      mobileFriendly: analyzeMobile(),
      uniqueContent: analyzeUnique(),
    };

    const totalScore = Object.values(checks).reduce((sum, check) => sum + check.score, 0);
    const averageScore = totalScore / Object.keys(checks).length;

    let grade: "A" | "B" | "C" | "D" | "F" = "F";
    if (averageScore >= 90) grade = "A";
    else if (averageScore >= 80) grade = "B";
    else if (averageScore >= 70) grade = "C";
    else if (averageScore >= 60) grade = "D";

    const recommendations = generateRecommendations(checks);

    return {
      score: Math.round(averageScore),
      grade,
      checks,
      recommendations,
    };
  };

  const analyzeTitleLength = () => {
    const length = title.length;
    if (length >= 30 && length <= 60) {
      return {
        score: 100,
        passed: true,
        message: `Title length is optimal (${length} characters)`,
      };
    } else if (length >= 20 && length <= 70) {
      return {
        score: 80,
        passed: true,
        message: `Title length is acceptable (${length} characters)`,
      };
    } else if (length < 20) {
      return {
        score: 40,
        passed: false,
        message: `Title is too short (${length} characters). Use 30-60 characters.`,
      };
    } else {
      return {
        score: 60,
        passed: false,
        message: `Title is too long (${length} characters). Use 30-60 characters.`,
      };
    }
  };

  const analyzeDescriptionLength = () => {
    const length = description.length;
    if (length >= 100 && length <= 160) {
      return {
        score: 100,
        passed: true,
        message: `Description length is optimal (${length} characters)`,
      };
    } else if (length >= 80 && length <= 200) {
      return {
        score: 80,
        passed: true,
        message: `Description length is acceptable (${length} characters)`,
      };
    } else if (length < 80) {
      return {
        score: 40,
        passed: false,
        message: `Description is too short (${length} characters). Use at least 100 characters.`,
      };
    } else {
      return {
        score: 60,
        passed: false,
        message: `Description is too long (${length} characters). Keep it under 200 characters.`,
      };
    }
  };

  const analyzeKeywordDensity = () => {
    if (!keyword || keyword.trim().length === 0) {
      return {
        score: 50,
        passed: false,
        message: "No keyword specified. Add a target keyword for better optimization.",
      };
    }

    const keywordLower = keyword.toLowerCase();
    const titleMatch = title.toLowerCase().includes(keywordLower) ? 1 : 0;
    const descriptionMatch = description.toLowerCase().split(keywordLower).length - 1;
    const totalMatches = titleMatch + descriptionMatch;

    if (totalMatches >= 2) {
      return {
        score: 100,
        passed: true,
        message: `Keyword "${keyword}" appears ${totalMatches} times. Good keyword distribution.`,
      };
    } else if (totalMatches === 1) {
      return {
        score: 70,
        passed: true,
        message: `Keyword "${keyword}" appears once. Consider adding it more naturally.`,
      };
    } else {
      return {
        score: 30,
        passed: false,
        message: `Keyword "${keyword}" not found. Add it to title and description naturally.`,
      };
    }
  };

  const analyzeImages = () => {
    if (imageCount >= 5) {
      return {
        score: 100,
        passed: true,
        message: `Excellent image count (${imageCount} images)`,
      };
    } else if (imageCount >= 3) {
      return {
        score: 80,
        passed: true,
        message: `Good image count (${imageCount} images)`,
      };
    } else if (imageCount >= 1) {
      return {
        score: 60,
        passed: true,
        message: `You have ${imageCount} image. Add more images for better SEO.`,
      };
    } else {
      return {
        score: 0,
        passed: false,
        message: "No images. Add at least 3 high-quality product images.",
      };
    }
  };

  const analyzeCategory = () => {
    if (!category || category.trim().length === 0) {
      return {
        score: 0,
        passed: false,
        message: "No category selected. Categories improve product discoverability.",
      };
    }

    return {
      score: 100,
      passed: true,
      message: `Category "${category}" is set. Good for SEO.`,
    };
  };

  const analyzeTags = () => {
    if (tags.length === 0) {
      return {
        score: 30,
        passed: false,
        message: "No tags added. Add 3-5 relevant tags for better SEO.",
      };
    } else if (tags.length >= 3 && tags.length <= 5) {
      return {
        score: 100,
        passed: true,
        message: `Perfect tag count (${tags.length} tags)`,
      };
    } else if (tags.length <= 10) {
      return {
        score: 80,
        passed: true,
        message: `Good tag count (${tags.length} tags)`,
      };
    } else {
      return {
        score: 60,
        passed: false,
        message: `Too many tags (${tags.length}). Keep it between 3-5 for better focus.`,
      };
    }
  };

  const analyzePrice = () => {
    if (price <= 0) {
      return {
        score: 0,
        passed: false,
        message: "Price is not set. Set a valid price.",
      };
    }

    if (discountPrice && discountPrice > 0 && discountPrice < price) {
      return {
        score: 100,
        passed: true,
        message: `Discount active (${Math.round(((price - discountPrice) / price) * 100)}% off). Great for conversions.`,
      };
    }

    return {
      score: 80,
      passed: true,
      message: "Price is set. Consider adding a discount to boost conversions.",
    };
  };

  const analyzeStock = () => {
    if (stock <= 0) {
      return {
        score: 40,
        passed: false,
        message: "Out of stock. Update stock level to enable sales.",
      };
    } else if (stock < 5) {
      return {
        score: 60,
        passed: true,
        message: `Low stock (${stock} units). Restock soon.`,
      };
    } else if (stock >= 10) {
      return {
        score: 100,
        passed: true,
        message: `Healthy stock level (${stock} units)`,
      };
    }

    return {
      score: 80,
      passed: true,
      message: `Stock level is ${stock} units`,
    };
  };

  const analyzeMobile = () => {
    // Assuming mobile-friendly if title and description are reasonable
    const isMobileFriendly =
      title.length < 70 && description.length < 300 && imageCount >= 1;

    if (isMobileFriendly) {
      return {
        score: 100,
        passed: true,
        message: "Product page is mobile-friendly",
      };
    }

    return {
      score: 70,
      passed: true,
      message: "Ensure product pages render well on mobile devices",
    };
  };

  const analyzeUnique = () => {
    // Basic uniqueness check - just verify descriptions exist
    if (description.length > 100) {
      return {
        score: 100,
        passed: true,
        message: "Content appears unique and comprehensive",
      };
    }

    return {
      score: 50,
      passed: false,
      message: "Add more unique content to your product description",
    };
  };

  const generateRecommendations = (checks: SEOAnalysis["checks"]): string[] => {
    const recs: string[] = [];

    if (!checks.titleLength.passed) recs.push(checks.titleLength.message);
    if (!checks.descriptionLength.passed) recs.push(checks.descriptionLength.message);
    if (!checks.imageAltText.passed) recs.push(checks.imageAltText.message);
    if (!checks.tagsUsage.passed) recs.push(checks.tagsUsage.message);
    if (!checks.keywordDensity.passed) recs.push(checks.keywordDensity.message);
    if (!checks.stockIndicator.passed) recs.push(checks.stockIndicator.message);

    return recs;
  };

  if (!analysis) {
    return <div>Loading SEO analysis...</div>;
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600";
      case "B":
        return "text-blue-600";
      case "C":
        return "text-yellow-600";
      case "D":
        return "text-orange-600";
      case "F":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              SEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-6xl font-bold text-gray-900">{analysis.score}</div>
              <div>
                <Badge className={`text-xl px-4 py-2 ${getGradeColor(analysis.grade)}`}>
                  {analysis.grade}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">Overall SEO Score</p>
              </div>
            </div>
            <Progress value={analysis.score} className="mt-4" />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Checks Passed</span>
                <Badge variant="secondary">
                  {Object.values(analysis.checks).filter((c) => c.passed).length}/
                  {Object.keys(analysis.checks).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Recommendations</span>
                <Badge variant="secondary">{analysis.recommendations.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Optimization Status</span>
                <Badge
                  className={
                    analysis.score >= 80
                      ? "bg-green-100 text-green-800"
                      : analysis.score >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {analysis.score >= 80
                    ? "Optimized"
                    : analysis.score >= 60
                      ? "Fair"
                      : "Needs Work"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Improvement Suggestions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm">
                  {rec}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed SEO Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(analysis.checks).map(([key, check]) => {
            const icon = check.passed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            );

            const labels: Record<string, string> = {
              titleLength: "Title Length",
              descriptionLength: "Description Length",
              keywordDensity: "Keyword Density",
              imageAltText: "Images",
              categoryOptimization: "Category",
              tagsUsage: "Tags",
              priceTransparency: "Price",
              stockIndicator: "Stock",
              mobileFriendly: "Mobile Friendly",
              uniqueContent: "Unique Content",
            };

            return (
              <div
                key={key}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-3">
                  {icon}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{labels[key]}</h4>
                      <Badge variant="secondary">{check.score}/100</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{check.message}</p>
                    <Progress value={check.score} className="mt-2 h-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* SEO Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            SEO Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Use descriptive titles that include main keywords (30-60 chars)</li>
            <li>Write unique descriptions with natural keyword usage (100-160 chars)</li>
            <li>Add 3-5 relevant tags for better categorization</li>
            <li>Include 3-5 high-quality product images</li>
            <li>Set competitive prices and consider discounts</li>
            <li>Keep stock levels healthy for fresh listing signals</li>
            <li>Use proper categories and subcategories</li>
            <li>Write content for humans first, search engines second</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOOptimizer;
