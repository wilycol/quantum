import { Advice, TradeFeedback } from './types';

// Verificar si la IA está habilitada
const isAIEnabled = (): boolean => {
  try {
    return import.meta.env.VITE_ENABLE_AI === '1' || process.env.ENABLE_AI === '1';
  } catch {
    return false;
  }
};

class TradingCoach {
  private adviceIndex: number = 0;
  private countdown: number = 10;
  private intervalId: NodeJS.Timeout | null = null;

  private adviceMessages = [
    "Prepárate para comprar en 10 segundos",
    "El RSI está en zona de sobreventa, considera comprar",
    "Tendencia alcista detectada, mantén posiciones largas",
    "Volatilidad alta, espera mejor entrada",
    "Soporte fuerte en $95, buen punto de compra",
    "Resistencia en $105, considera tomar ganancias",
    "Mercado lateral, reduce el tamaño de posición",
    "Momentum positivo, añade a posiciones existentes",
    "Divergencia RSI, posible reversión",
    "Volumen bajo, espera confirmación"
  ];

  private feedbackMessages = {
    perfect: [
      "¡Excelente timing!",
      "Perfecto, entraste en el momento ideal",
      "¡Impresionante! Timing de profesional",
      "Eso es trading de calidad"
    ],
    early: [
      "Te adelantaste 3 segundos, pero buena intuición",
      "Un poco temprano, pero la dirección era correcta",
      "Entrada anticipada, mantén esa intuición",
      "Bueno, aunque podrías haber esperado un poco más"
    ],
    late: [
      "Llegaste tarde, pero la señal era correcta",
      "Timing un poco retrasado, pero buena decisión",
      "Podrías haber entrado antes, pero bien ejecutado",
      "Señal tardía, pero dirección acertada"
    ],
    correct: [
      "¡Correcto! La señal era acertada",
      "Bien hecho, análisis técnico preciso",
      "¡Perfecto! RSI confirmó tu decisión",
      "Excelente lectura del mercado"
    ],
    incorrect: [
      "Señal incorrecta, revisa el análisis",
      "El RSI no confirmó tu decisión",
      "Timing equivocado, ajusta tu estrategia",
      "Análisis técnico necesita refinamiento"
    ]
  };

  /**
   * Obtiene el siguiente consejo del coach
   */
  nextAdvice(): Advice {
    // Si la IA no está habilitada, usar consejos mock
    if (!isAIEnabled()) {
      const message = this.adviceMessages[this.adviceIndex % this.adviceMessages.length];
      this.adviceIndex++;
      
      // Simular diferentes tipos de consejos
      const sides: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold'];
      const randomSide = sides[Math.floor(Math.random() * sides.length)];
      
      return {
        message,
        countdown: this.countdown,
        side: randomSide
      };
    }
    
    // Aquí se podría integrar con una IA real
    // Por ahora, usar consejos mock como fallback
    const message = this.adviceMessages[this.adviceIndex % this.adviceMessages.length];
    this.adviceIndex++;
    
    const sides: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold'];
    const randomSide = sides[Math.floor(Math.random() * sides.length)];
    
    return {
      message,
      countdown: this.countdown,
      side: randomSide
    };
  }

  /**
   * Inicia el countdown del consejo
   */
  startCountdown(callback?: (countdown: number) => void): void {
    this.countdown = 10;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.countdown--;
      
      if (callback) {
        callback(this.countdown);
      }
      
      if (this.countdown <= 0) {
        this.stopCountdown();
        // Generar nuevo consejo automáticamente
        this.nextAdvice();
        this.startCountdown(callback);
      }
    }, 1000);
  }

  /**
   * Detiene el countdown
   */
  stopCountdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Genera feedback basado en el timing y corrección del trade
   */
  feedback(feedback: { timing: 'early' | 'perfect' | 'late'; correctness: 'correct' | 'incorrect' }): TradeFeedback {
    const timingMessages = this.feedbackMessages[feedback.timing];
    const correctnessMessages = this.feedbackMessages[feedback.correctness];
    
    const timingMessage = timingMessages[Math.floor(Math.random() * timingMessages.length)];
    const correctnessMessage = correctnessMessages[Math.floor(Math.random() * correctnessMessages.length)];
    
    return {
      timing: feedback.timing,
      correctness: feedback.correctness,
      message: `${timingMessage}. ${correctnessMessage}`
    };
  }

  /**
   * Obtiene consejo personalizado basado en el estado del mercado
   */
  getPersonalizedAdvice(rsi: number | null, signal: 'buy' | 'sell' | 'hold'): Advice {
    let message = "Analiza el mercado antes de operar";
    
    if (rsi !== null) {
      if (rsi <= 30) {
        message = "RSI en sobreventa extrema, oportunidad de compra";
      } else if (rsi >= 70) {
        message = "RSI en sobrecompra, considera vender";
      } else if (rsi > 50) {
        message = "Mercado con momentum alcista";
      } else {
        message = "Mercado con momentum bajista";
      }
    }
    
    return {
      message,
      countdown: this.countdown,
      side: signal
    };
  }

  /**
   * Limpia recursos
   */
  destroy(): void {
    this.stopCountdown();
  }
}

// Exportar instancia singleton
export const coach = new TradingCoach();

// Exportar funciones individuales para compatibilidad
export function nextAdvice(): Advice {
  return coach.nextAdvice();
}

export function feedback(feedback: { timing: 'early' | 'perfect' | 'late'; correctness: 'correct' | 'incorrect' }): TradeFeedback {
  return coach.feedback(feedback);
}
