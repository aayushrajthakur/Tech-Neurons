import re
import string
from typing import Dict, List, Any

class RiskAnalyzer:
    """Analyzes text for risk levels with high priority to health-related issues and emergencies."""

    def __init__(self):
        self.high_risk_keywords = {
            'violence': [
                'kill', 'murder', 'attack', 'assault', 'fight', 'violence', 'weapon',
                'gun', 'knife', 'bomb', 'explosive', 'hurt', 'harm', 'destroy', 'threat', 'threaten'
            ],
            'emergency': [
                'emergency', 'help', 'urgent', 'crisis', 'danger', 'panic',
                'accident', 'injury', 'bleeding', 'unconscious', 'overdose', 'fire', 'medical'
            ],
            'illegal': [
                'drugs', 'cocaine', 'heroin', 'marijuana', 'steal', 'theft', 'robbery',
                'fraud', 'illegal', 'criminal', 'crime', 'smuggle', 'trafficking'
            ],
            'mental_health': [
                'suicide', 'suicidal', 'depression', 'hopeless', 'worthless', 'end it all',
                'give up', 'can\'t go on', 'self-harm'
            ]
        }

        self.medium_risk_keywords = {
            'financial': [
                'debt', 'bankruptcy', 'foreclosure', 'eviction', 'unemployed', 'fired',
                'laid off', 'financial trouble', 'money problems'
            ],
            'health': [
                'sick', 'illness', 'hospital', 'doctor', 'medication', 'pain',
                'chronic', 'disease', 'treatment', 'surgery', 'infection'
            ],
            'relationship': [
                'divorce', 'breakup', 'argument', 'conflict', 'abuse', 'domestic',
                'harassment', 'stalking', 'restraining order'
            ],
            'legal': [
                'court', 'lawsuit', 'lawyer', 'attorney', 'legal action', 'investigation',
                'charges', 'warrant', 'arrest'
            ]
        }

        self.low_risk_keywords = {
            'work': [
                'job', 'work', 'career', 'office', 'meeting', 'project', 'deadline',
                'colleague', 'boss', 'promotion'
            ],
            'daily_life': [
                'family', 'friends', 'home', 'school', 'education', 'hobby', 'vacation',
                'shopping', 'cooking', 'exercise'
            ],
            'positive': [
                'happy', 'excited', 'good', 'great', 'wonderful', 'amazing', 'love',
                'joy', 'celebration', 'success'
            ]
        }

        self.risk_weights = {
            'violence': 3.0,
            'emergency': 3.0,
            'illegal': 2.5,
            'mental_health': 3.0,
            'financial': 1.5,
            'health': 3.0,
            'relationship': 2.0,
            'legal': 2.0,
            'work': 0.5,
            'daily_life': 0.3,
            'positive': -0.5
        }

        self.critical_health_keywords = [
            'accident', 'injury', 'bleeding', 'unconscious', 'overdose', 'collapse', 'fire'
        ]

    def _detect_emergency_type(self, text: str) -> str:
        categories = {
            'Accident': ['accident', 'crash', 'collision'],
            'Cardiac Arrest': ['cardiac', 'heart attack', 'chest pain', 'pulse', 'fainted'],
            'Fire': ['fire', 'burning', 'smoke', 'flames'],
            'Overdose': ['overdose', 'drug', 'pills', 'poison'],
            'Violence': ['attack', 'fight', 'assault', 'gun', 'knife', 'shooting'],
            'Mental Health Crisis': ['suicide', 'depressed', 'self-harm', 'give up'],
            'Unconscious': ['unconscious', 'not breathing', 'passed out'],
            'Medical Emergency': ['emergency', 'bleeding', 'pain', 'injury', 'sick'],
        }
        for label, keywords in categories.items():
            for keyword in keywords:
                if keyword in text:
                    return label
        return 'General Emergency'

    def analyze_risk(self, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return self._create_empty_result()

        processed_text = self._preprocess_text(text)
        risk_factors = self._find_risk_factors(processed_text)
        risk_score = self._calculate_risk_score(risk_factors)
        risk_level = self._determine_risk_level(risk_score)
        recommendations = self._generate_recommendations(risk_level, risk_factors)
        sentiment_score = self._analyze_sentiment(processed_text)
        urgency_indicators = self._detect_urgency_indicators(processed_text)
        emergency_type = self._detect_emergency_type(processed_text)

        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'sentiment_score': sentiment_score,
            'urgency_indicators': urgency_indicators,
            'word_count': len(processed_text.split()),
            'original_text': text,
            'emergency_type': emergency_type
        }

    def _preprocess_text(self, text: str) -> str:
        text = text.lower()
        text = ' '.join(text.split())
        text = text.translate(str.maketrans('', '', string.punctuation.replace("'", "")))
        return text

    def _find_risk_factors(self, text: str) -> List[Dict[str, Any]]:
        risk_factors = []
        for group, keywords in {**self.high_risk_keywords, **self.medium_risk_keywords, **self.low_risk_keywords}.items():
            for keyword in keywords:
                if keyword in text:
                    risk_factors.append({
                        'word': keyword,
                        'category': group,
                        'risk_level': self._get_risk_level_from_category(group),
                        'weight': self.risk_weights[group]
                    })
        return risk_factors

    def _get_risk_level_from_category(self, category: str) -> str:
        weight = self.risk_weights.get(category, 0)
        if weight >= 2.5:
            return 'HIGH'
        elif weight >= 1.0:
            return 'MEDIUM'
        return 'LOW'

    def _calculate_risk_score(self, risk_factors: List[Dict[str, Any]]) -> float:
        if not risk_factors:
            return 0.0
        for factor in risk_factors:
            if factor['category'] == 'emergency' and factor['word'] in self.critical_health_keywords:
                return 10.0
        total_weight = sum(factor['weight'] for factor in risk_factors)
        unique_keywords = len(set(factor['word'] for factor in risk_factors))
        score = total_weight / max(1, unique_keywords)
        if any(f['category'] == 'health' for f in risk_factors):
            score *= 1.25
        high_risk_count = sum(1 for f in risk_factors if f['risk_level'] == 'HIGH')
        if high_risk_count:
            score *= (1 + high_risk_count * 0.15)
        return round(min(10.0, max(0.0, score)), 2)

    def _determine_risk_level(self, risk_score: float) -> str:
        if risk_score >= 4.0:
            return "HIGH"
        elif risk_score >= 2.0:
            return "MEDIUM"
        return "LOW"

    def _generate_recommendations(self, risk_level: str, risk_factors: List[Dict[str, Any]]) -> List[str]:
        recommendations = []
        if risk_level == "HIGH":
            recommendations.extend([
                "⚠️ Immediate attention required - contact emergency services or support",
                "📞 If threat/violence: call 911 or emergency helpline",
                "🏥 If medical emergency: go to hospital or call ambulance",
                "💬 Mental health: contact 988 or local crisis support"
            ])
        elif risk_level == "MEDIUM":
            recommendations.extend([
                "⚡ Monitor closely, possible intervention may be required",
                "🤝 Consider seeking professional/legal/financial support",
                "📋 Document any escalations or concerning signs"
            ])
        else:
            recommendations.extend([
                "✅ Situation appears safe or routine",
                "📊 Continue monitoring, no immediate action required"
            ])

        categories = set(f['category'] for f in risk_factors)
        if 'mental_health' in categories:
            recommendations.append("🧠 Mental health support: Call 988 (24/7 crisis line)")
        if 'emergency' in categories and any(f['word'] in self.critical_health_keywords for f in risk_factors):
            recommendations.append("🚑 Critical medical emergency detected — Call ambulance or go to ER immediately.")
        if 'financial' in categories:
            recommendations.append("💰 Contact financial counselors or assistance programs")
        if 'legal' in categories:
            recommendations.append("⚖️ Legal advice recommended from certified professionals")
        return recommendations

    def _analyze_sentiment(self, text: str) -> float:
        positive_words = ['good', 'great', 'happy', 'love', 'excellent', 'wonderful', 'amazing', 'fantastic', 'positive', 'success']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'negative', 'failure', 'sad', 'angry']
        words = text.split()
        pos = sum(1 for w in words if w in positive_words)
        neg = sum(1 for w in words if w in negative_words)
        if pos + neg == 0:
            return 0.0
        return (pos - neg) / (pos + neg)

    def _detect_urgency_indicators(self, text: str) -> List[str]:
        patterns = [
            r'\b(now|immediately|urgent|emergency|asap|right now|help)\b',
            r'\b(can\'t wait|need help|critical|emergency)\b',
            r'[!]{2,}',
            r'\b(please|help|urgent|emergency)\b.*[!]'
        ]
        indicators = []
        for p in patterns:
            indicators.extend(re.findall(p, text, re.IGNORECASE))
        return list(set(indicators))

    def _create_empty_result(self) -> Dict[str, Any]:
        return {
            'risk_level': 'LOW',
            'risk_score': 0.0,
            'risk_factors': [],
            'recommendations': ['📝 No text provided for analysis'],
            'sentiment_score': 0.0,
            'urgency_indicators': [],
            'word_count': 0,
            'original_text': '',
            'emergency_type': 'Unknown'
        }
