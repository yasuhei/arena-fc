// Componente para renderizar estrelas com meio ponto
interface StarRatingProps {
  rating: number;
  size?: string;
}

export const StarRating = ({ rating, size = 'text-lg' }: StarRatingProps) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  // Estrelas cheias
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className={`${size} text-yellow-500`}>⭐</span>
    );
  }
  
  // Meia estrela
  if (hasHalfStar) {
    stars.push(
      <span key="half" className={`${size} text-yellow-400`}>⭐</span>
    );
  }
  
  // Estrelas vazias
  const usedStars = fullStars + (hasHalfStar ? 1 : 0);
  const emptyStars = 5 - usedStars;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className={`${size} text-gray-300`}>☆</span>
    );
  }
  
  return <>{stars}</>;
};
