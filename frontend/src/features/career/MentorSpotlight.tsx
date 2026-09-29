import { motion } from "framer-motion";

interface Mentor {
  name: string;
  role: string;
  college: string;
  achievement: string;
}

const MENTORS: Record<string, Mentor[]> = {
  "Software Engineer": [
    { name: "Sundar Pichai", role: "CEO, Google", college: "IIT Kharagpur → Wharton", achievement: "From IIT to leading the world's biggest tech company" },
    { name: "Satya Nadella", role: "CEO, Microsoft", college: "Manipal → Wisconsin", achievement: "Transformed Microsoft into $3T company" },
    { name: "Sridhar Vembu", role: "CEO, Zoho", college: "IIT Madras → Princeton", achievement: "Built Zoho from Chennai, refused to go to Silicon Valley" },
  ],
  "AI/ML Engineer": [
    { name: "Sundar Pichai", role: "CEO, Google", college: "IIT Kharagpur", achievement: "Led the Google AI revolution" },
    { name: "Pranav Mistry", role: "President, STAR Labs Samsung", college: "IIT Bombay → MIT", achievement: "Invented SixthSense wearable technology" },
  ],
  "Data Scientist": [
    { name: "DJ Patil", role: "Former US Chief Data Scientist", college: "University of Maryland", achievement: "First Chief Data Scientist of the United States" },
    { name: "Dhiraj Rajaram", role: "Founder, Mu Sigma", college: "University of Chicago", achievement: "Built India's largest analytics firm from scratch" },
  ],
  "Doctor": [
    { name: "Dr. Devi Shetty", role: "Founder, Narayana Health", college: "KGMC Lucknow", achievement: "Made heart surgery affordable for poor Indians" },
    { name: "Dr. Prathap Reddy", role: "Founder, Apollo Hospitals", college: "Stanley Medical College", achievement: "Built India's largest healthcare network" },
  ],
  "IAS Officer": [
    { name: "Armstrong Pame", role: "IAS Officer, Manipur", college: "DU + LBSNAA", achievement: "Built highway crowdfunded by 1 lakh Facebook friends" },
    { name: "Tina Dabi", role: "IAS Officer (UPSC Rank 1)", college: "Lady Sri Ram College", achievement: "First Dalit woman to top UPSC CSE" },
  ],
  "CA (Chartered Accountant)": [
    { name: "Naina Lal Kidwai", role: "Former Chairman, HSBC India", college: "IIM Ahmedabad", achievement: "First Indian woman to head a foreign bank in India" },
    { name: "Suresh Prabhu", role: "Former Railway Minister", college: "CA + Law", achievement: "Known as one of India's most respected CAs in politics" },
  ],
  "Lawyer": [
    { name: "Fali S. Nariman", role: "Senior Advocate, Supreme Court", college: "Law College Pune", achievement: "One of India's most respected constitutional lawyers" },
    { name: "Menaka Guruswamy", role: "Senior Advocate", college: "NLSIU → Oxford → Harvard", achievement: "Argued the landmark Section 377 case" },
  ],
  "UX Designer": [
    { name: "Srishti Gupta", role: "Design Lead, Google", college: "NID Ahmedabad", achievement: "Led design for Google Pay India" },
  ],
  "Entrepreneur": [
    { name: "Ritesh Agarwal", role: "Founder, OYO Rooms", college: "Dropout", achievement: "Built OYO into India's largest hotel chain at age 19" },
    { name: "Bhavish Aggarwal", role: "Founder, Ola", college: "IIT Bombay", achievement: "Built Ola from a cab aggregator to EV manufacturer" },
    { name: "Falguni Nayar", role: "Founder, Nykaa", college: "IIM Ahmedabad", achievement: "Left investment banking at 49 to build a ₹30,000 Cr company" },
  ],
  "Civil Engineer": [
    { name: "E. Sreedharan", role: "Metro Man of India", college: "GEC Kakinada", achievement: "Built Delhi Metro on time and under budget" },
  ],
  "Journalist": [
    { name: "Ravish Kumar", role: "Journalist, NDTV", college: "DU → IIMC", achievement: "Won Ramon Magsaysay Award for journalism" },
    { name: "Barkha Dutt", role: "Journalist & Author", college: "St. Stephen's → Columbia", achievement: "Pioneered war journalism in India from Kargil" },
  ],
};

export default function MentorSpotlight({ career }: { career: string | { title?: string } }) {
  const mentors = MENTORS[career?.title] || [];
  if (mentors.length === 0) return null;

  return (
    <div className="glass-card">
      <h3 className="font-semibold text-foreground mb-4">🌟 Inspiring {career.title}s from India</h3>
      {mentors.map((mentor, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`py-3 ${i < mentors.length - 1 ? "border-b border-border" : ""}`}>
          <div className="flex gap-3 items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-bold text-primary-foreground shrink-0">
              {mentor.name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{mentor.name}</p>
              <p className="text-xs text-primary">{mentor.role}</p>
              <p className="text-[10px] text-muted-foreground">📚 {mentor.college}</p>
              <p className="text-xs text-muted-foreground mt-1 italic">"{mentor.achievement}"</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
