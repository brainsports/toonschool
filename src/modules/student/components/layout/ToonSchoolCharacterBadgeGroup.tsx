import { V2_CHARACTER_EXPRESSIONS } from '../../data/characterAssets';

interface ToonSchoolCharacterBadgeGroupProps {
  className?: string;
  textColorClass?: string;
}

export default function ToonSchoolCharacterBadgeGroup({ 
  className = "",
  textColorClass = "text-slate-800" 
}: ToonSchoolCharacterBadgeGroupProps) {
  return (
    <div className={`flex items-end gap-3 md:gap-4 shrink-0 ${className}`}>
      <div className="flex flex-col items-center gap-1">
        <img 
          src={V2_CHARACTER_EXPRESSIONS.hana.smile} 
          alt="하나 선생님" 
          className="h-[38px] md:h-[42px] object-contain drop-shadow-sm" 
        />
        <span className={`text-[10px] md:text-[11px] font-bold ${textColorClass}`}>
          하나 선생님
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <img 
          src={V2_CHARACTER_EXPRESSIONS.doyoon.smile} 
          alt="도윤" 
          className="h-[38px] md:h-[42px] object-contain drop-shadow-sm" 
        />
        <span className={`text-[10px] md:text-[11px] font-bold ${textColorClass}`}>
          도윤
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <img 
          src={V2_CHARACTER_EXPRESSIONS.seoa.smile} 
          alt="서아" 
          className="h-[38px] md:h-[42px] object-contain drop-shadow-sm" 
        />
        <span className={`text-[10px] md:text-[11px] font-bold ${textColorClass}`}>
          서아
        </span>
      </div>
    </div>
  );
}
