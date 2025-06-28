import re
from typing import Dict, List, Any
from collections import Counter
import string

class RiskAnalyzer:
    """Analyzes text for risk levels based on keyword patterns and context."""
    
    def __init__(self):
        # Define risk keywords by category
        self.high_risk_keywords = {
            'violence': ['kill', 'murder', 'attack', 'assault', 'fight', 'violence', 'weapon', 'gun', 'knife', 'bomb', 'explosive', 'hurt', 'harm', 'destroy', 'threat', 'threaten'],
            'emergency': ['emergency', 'help', 'urgent', 'crisis', 'danger', 'panic', 'accident', 'injury', 'bleeding', 'unconscious', 'overdose', 'fire', 'medical'],
            'illegal': ['drugs', 'cocaine', 'heroin', 'marijuana', 'steal', 'theft', 'robbery', 'fraud', 'illegal', 'criminal', 'crime', 'smuggle', 'trafficking'],
            'mental_health': ['suicide', 'suicidal', 'depression', 'hopeless', 'worthless', 'end it all', 'give up', 'can\'t go on', 'self-harm']
        }
        
        self.medium_risk_keywords = {
            'financial': ['debt', 'bankruptcy', 'foreclosure', 'eviction', 'unemployed', 'fired', 'laid off', 'financial trouble', 'money problems'],
            'health': ['sick', 'illness', 'hospital', 'doctor', 'medication', 'pain', 'chronic', 'disease', 'treatment', 'surgery'],
            'relationship': ['divorce', 'breakup', 'argument', 'conflict', 'abuse', 'domestic', 'harassment', 'stalking', 'restraining order'],
            'legal': ['court', 'lawsuit', 'lawyer', 'attorney', 'legal action', 'investigation', 'charges', 'warrant', 'arrest']
        }
        
        self.low_risk_keywords = {
            'work': ['job', 'work', 'career', 'office', 'meeting', 'project', 'deadline', 'colleague', 'boss', 'promotion'],
            'daily_life': ['family', 'friends', 'home', 'school', 'education', 'hobby', 'vacation', 'shopping', 'cooking', 'exercise'],
            'positive': ['happy', 'excited', 'good', 'great', 'wonderful', 'amazing', 'love', 'joy', 'celebration', 'success']
        }
        
        # Risk weights for different categories
        self.risk_weights = {
            'violence': 3.0,
            'emergency': 3.0,
            'illegal': 2.5,
            'mental_health': 3.0,
            'financial': 1.5,
            'health': 1.5,
            'relationship': 2.0,
            'legal': 2.0,
            'work': 0.5,
            'daily_life': 0.3,
            'positive': -0.5  # Positive keywords reduce risk
        }
    
    def analyze_risk(self, text: str) -> Dict[str, Any]:
        """
        Analyze the risk level of given text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary containing risk analysis results
        """
        if not text or not text.strip():
            return self._create_empty_result()
        
        # Preprocess text
        processed_text = self._preprocess_text(text)
        
        # Find risk factors
        risk_factors = self._find_risk_factors(processed_text)
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(risk_factors)
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, risk_factors)
        
        # Additional analysis
        sentiment_score = self._analyze_sentiment(processed_text)
        urgency_indicators = self._detect_urgency_indicators(processed_text)
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'sentiment_score': sentiment_score,
            'urgency_indicators': urgency_indicators,
            'word_count': len(processed_text.split()),
            'original_text': text
        }
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for analysis."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove punctuation except apostrophes
        text = text.translate(str.maketrans('', '', string.punctuation.replace("'", "")))
        
        return text
    
    def _find_risk_factors(self, text: str) -> List[Dict[str, Any]]:
        """Find risk factors in the text."""
        risk_factors = []
        words = text.split()
        
        # Check high-risk keywords
        for category, keywords in self.high_risk_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    risk_factors.append({
                        'word': keyword,
                        'category': category,
                        'risk_level': 'HIGH',
                        'weight': self.risk_weights[category]
                    })
        
        # Check medium-risk keywords
        for category, keywords in self.medium_risk_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    risk_factors.append({
                        'word': keyword,
                        'category': category,
                        'risk_level': 'MEDIUM',
                        'weight': self.risk_weights[category]
                    })
        
        # Check low-risk keywords
        for category, keywords in self.low_risk_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    risk_factors.append({
                        'word': keyword,
                        'category': category,
                        'risk_level': 'LOW',
                        'weight': self.risk_weights[category]
                    })
        
        return risk_factors
    
    def _calculate_risk_score(self, risk_factors: List[Dict[str, Any]]) -> float:
        """Calculate overall risk score."""
        if not risk_factors:
            return 0.0
        
        total_weight = sum(factor['weight'] for factor in risk_factors)
        word_count = len(set(factor['word'] for factor in risk_factors))
        
        # Normalize by word count to prevent inflation from repeated keywords
        base_score = total_weight / max(word_count, 1)
        
        # Apply additional factors
        high_risk_count = sum(1 for factor in risk_factors if factor['risk_level'] == 'HIGH')
        if high_risk_count > 0:
            base_score *= (1 + high_risk_count * 0.2)  # Boost for multiple high-risk factors
        
        return max(0.0, min(10.0, base_score))  # Clamp between 0 and 10
    
    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level based on score."""
        if risk_score >= 4.0:
            return "HIGH"
        elif risk_score >= 2.0:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_recommendations(self, risk_level: str, risk_factors: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on risk analysis."""
        recommendations = []
        
        if risk_level == "HIGH":
            recommendations.extend([
                "⚠️ Immediate attention required - consider contacting appropriate authorities or support services",
                "📞 If this involves threats or violence, contact emergency services (911)",
                "🏥 If this involves medical emergency, seek immediate medical attention",
                "💬 Consider reaching out to crisis support hotlines if mental health related"
            ])
        elif risk_level == "MEDIUM":
            recommendations.extend([
                "⚡ Situation requires monitoring and potential intervention",
                "🤝 Consider seeking professional advice or support",
                "📋 Document any concerning patterns or escalations",
                "👥 Involve trusted contacts or support networks if appropriate"
            ])
        else:
            recommendations.extend([
                "✅ Situation appears to be within normal parameters",
                "📊 Continue monitoring for any changes",
                "🔄 Regular check-ins may be beneficial"
            ])
        
        # Add specific recommendations based on risk categories
        categories = set(factor['category'] for factor in risk_factors)
        
        if 'mental_health' in categories:
            recommendations.append("🧠 Mental health resources: National Suicide Prevention Lifeline (988)")
        
        if 'violence' in categories or 'emergency' in categories:
            recommendations.append("🚨 Emergency contacts: 911 for immediate threats")
        
        if 'financial' in categories:
            recommendations.append("💰 Financial counseling services may be helpful")
        
        if 'legal' in categories:
            recommendations.append("⚖️ Consider consulting with legal professionals")
        
        return recommendations
    
    def _analyze_sentiment(self, text: str) -> float:
        """Simple sentiment analysis based on positive/negative word counts."""
        positive_words = ['good', 'great', 'happy', 'love', 'excellent', 'wonderful', 'amazing', 'fantastic', 'positive', 'success']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'negative', 'failure', 'sad', 'angry']
        
        words = text.split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        total_sentiment_words = positive_count + negative_count
        if total_sentiment_words == 0:
            return 0.0
        
        return (positive_count - negative_count) / total_sentiment_words
    
    def _detect_urgency_indicators(self, text: str) -> List[str]:
        """Detect indicators of urgency in the text."""
        urgency_patterns = [
            r'\b(now|immediately|urgent|emergency|asap|right now|help)\b',
            r'\b(can\'t wait|need help|urgent|critical|emergency)\b',
            r'[!]{2,}',  # Multiple exclamation marks
            r'\b(please|help|urgent|emergency)\b.*[!]'
        ]
        
        indicators = []
        for pattern in urgency_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            indicators.extend(matches)
        
        return list(set(indicators))  # Remove duplicates
    
    def _create_empty_result(self) -> Dict[str, Any]:
        """Create empty result for invalid input."""
        return {
            'risk_level': 'LOW',
            'risk_score': 0.0,
            'risk_factors': [],
            'recommendations': ['📝 No text provided for analysis'],
            'sentiment_score': 0.0,
            'urgency_indicators': [],
            'word_count': 0,
            'original_text': ''
        }
