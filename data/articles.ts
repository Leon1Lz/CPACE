export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  categoryColor: string
  iconName: string
  image: string
  featured: boolean
  date?: string
  createdAt: string
  comments: number
}

export const articlesData: Article[] = [
  {
    id: "art-20",
    slug: "cpace-good-samaritan-cmms-exam",
    title: "CPACE and Good Samaritan Colleges Elevate Marketing Careers",
    excerpt: "Good Samaritan Colleges students completed their in-person CMMS® exam on August 26, 2026, validating their readiness for real-world marketing careers…",
    content: `<p>Good Samaritan Colleges students completed their in-person CMMS® exam on August 26, 2026, marking another successful milestone in the partnership between the institution and CPACE Philippines.</p>
<p>The Certified Marketing Management Specialist (CMMS®) examination validates students' competencies in modern marketing strategies, consumer behavior analysis, digital marketing fundamentals, and brand management. By earning this credential, graduates demonstrate their readiness for real-world marketing careers.</p>
<p>This achievement reflects the growing commitment of educational institutions in the Philippines to integrate industry-recognized certifications into their academic frameworks, ensuring students graduate with both theoretical knowledge and practical, market-ready skills.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/Good Samaritan Colleges - June 30.jpg",
    featured: true,
    date: "August 29, 2026",
    createdAt: "2026-08-29T08:00:00.000Z",
    comments: 2,
  },
  {
    id: "art-21",
    slug: "uc-students-cpace-certifications",
    title: "UC Students Gain CPACE Certifications in Business & Finance",
    excerpt: "UC students earn CFMS®, CMMS®, and COMS® certifications through CPACE exams, boosting career readiness and industry credibility…",
    content: `<p>Students from the University of Caloocan (UC) have successfully earned multiple CPACE certifications including the CFMS®, CMMS®, and COMS® credentials, significantly boosting their career readiness and industry credibility.</p>
<p>The certification examinations covered key competency areas in financial management, marketing management, and operations management — equipping students with validated skills that are highly valued by employers across various industries.</p>
<p>This achievement underscores the strong partnership between UC and CPACE Philippines, as well as the university's commitment to producing graduates who are not only academically prepared but also professionally certified and globally competitive.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/UC.jpg",
    featured: false,
    date: "August 18, 2026",
    createdAt: "2026-08-18T08:00:00.000Z",
    comments: 5,
  },
  {
    id: "art-22",
    slug: "beyond-the-paycheck-labor-law",
    title: "Beyond the Paycheck: The Human Heart of Labor Law",
    excerpt: "The Philippine Labor Code is essentially a social agreement designed to uphold the dignity of individuals behind the profession…",
    content: `<p>The Philippine Labor Code, however, is essentially a social agreement designed to uphold the dignity of individuals behind the profession. At its core, labor law in the Philippines is not merely about rules and regulations — it is a framework built on the recognition that workers are human beings with inherent rights and dignity.</p>
<p>This article explores the deeper philosophical underpinnings of Philippine labor legislation, examining how employment standards, security of tenure, and fair compensation practices reflect society's commitment to protecting the welfare of every working Filipino.</p>
<p>Understanding the human heart of labor law is essential for HR professionals, business leaders, and employees alike — as it shapes the very foundation of workplace culture and organizational integrity.</p>`,
    category: "Industry Insights",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconName: "trending-up",
    image: "/assets/articles/Beyond the Paycheck.jpg",
    featured: false,
    date: "August 13, 2026",
    createdAt: "2026-08-13T08:00:00.000Z",
    comments: 7,
  },
  {
    id: "art-1",
    slug: "cpace-san-beda-partnership",
    title: "CPACE Philippines and San Beda University Manila Forge Partnership to Expand Microcredential Opportunities for Students",
    excerpt: "With this collaboration, CPACE Philippines and San Beda University Manila reaffirm their dedication to empowering students with globally competitive credentials…",
    content: `<p>CPACE Philippines and San Beda University have officially formalized a strategic partnership through the signing of a Memorandum of Agreement (MOA), marking a significant step toward strengthening industry-academe collaboration.</p>
<p>The partnership aims to provide San Beda students with enhanced access to globally aligned certification programs and microcredential opportunities. Through this initiative, students will be able to complement their academic degrees with industry-relevant certifications, equipping them with practical skills and competencies demanded in today’s evolving workforce.</p>
<p>This collaboration underscores both institutions’ shared commitment to bridging the gap between academic learning and real-world application. By integrating CPACE’s professional certification programs into the university ecosystem, students are expected to gain a competitive edge as they prepare to enter their respective industries.</p>
<p>San Beda University, known for its strong academic foundation and commitment to holistic student development, continues to expand its industry linkages to ensure that graduates are future-ready. Meanwhile, CPACE Philippines continues to broaden its reach across educational institutions, reinforcing its mission to elevate professional standards through accessible and high-quality certification programs.</p>
<p>The partnership reflects a growing trend among higher education institutions to align closely with industry leaders—ensuring that graduates are not only academically prepared but also equipped with globally competitive credentials.</p>
<p>With this collaboration, CPACE Philippines and San Beda University Manila reaffirm their dedication to empowering the next generation of professionals through innovation, excellence, and meaningful partnerships.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/San Beda University - March 18.jpg",
    featured: false,
    date: "March 18, 2026",
    createdAt: "2026-03-18T08:00:00.000Z",
    comments: 12,
  },
  {
    id: "art-2",
    slug: "beyond-job-titles",
    title: "Beyond Job Titles: Orchestrating People, Tech, and Purpose",
    excerpt: "We're living in a liminal hour where titles matter less than capability. This piece explores how modern organizations orchestrate human talent and tech…",
    content: `<p>We're living in a liminal hour where titles matter less than capability. Modern organizations must focus on orchestrating people, technology, and purpose as a single ecosystem rather than working in isolated silos.</p>
<p>To build future-proof teams, organizations need to move away from static job descriptions and embrace dynamic, skill-based architectures. Aligning people's innate talent with technology empowers them to achieve higher productivity and organizational goals.</p>
<p>Ultimately, purpose remains the ultimate compass. A strong, shared vision unites teams and ensures technology acts as an enabler rather than a disruptor.</p>`,
    category: "Industry Insights",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconName: "trending-up",
    image: "/assets/articles/Beyond the Paycheck.jpg",
    featured: false,
    date: "February 6, 2026",
    createdAt: "2026-02-06T08:00:00.000Z",
    comments: 8,
  },
  {
    id: "art-3",
    slug: "fintech-revolution-summit-2026",
    title: "Fintech Revolution Summit – Philippines 2026",
    excerpt: "The Fintech Revolution Summit is set to return to Manila on April 30, 2026, bringing together innovators, leaders, and regulators…",
    content: `<p>The Fintech Revolution Summit is set to return to Manila on April 30, 2026, bringing together industry leaders, innovators, and policymakers from across the region.</p>
<p>The summit will focus on the rapid growth of digital banking, decentralized finance, and blockchain integrations within the Philippine financial sector. Key speakers will address the challenges of cybersecurity, financial inclusion, and the regulatory frameworks required to sustain digital transformation.</p>
<p>Attendees can expect deep-dive panels, networking opportunities, and showcase exhibitions of the latest fintech solutions poised to redefine banking and commerce.</p>`,
    category: "Events",
    categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
    iconName: "zap",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    featured: false,
    date: "January 26, 2026",
    createdAt: "2026-01-26T08:00:00.000Z",
    comments: 15,
  },
  {
    id: "art-4",
    slug: "chro-philippines-2026",
    title: "CHRO Philippines 2026: Navigating the Future of HR in the Philippines",
    excerpt: "The conference highlights the critical role of human resource leaders in shaping agile, remote-friendly organizational cultures…",
    content: `<p>CHRO Philippines 2026 highlights the critical role of human resource leaders in shaping agile and remote-friendly organizational cultures.</p>
<p>Topics include modern talent acquisition strategies, mental health and wellness in the workplace, and leveraging AI for HR analytics. As the hybrid work model becomes a permanent fixture in the country, HR professionals must acquire new competencies to keep their workforce motivated, collaborative, and highly engaged.</p>
<p>Join senior executives and industry pioneers to discuss strategies, build networks, and share insights.</p>`,
    category: "Events",
    categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
    iconName: "zap",
    image: "/assets/articles/CHRO Philippines 2026.jpg",
    featured: false,
    date: "January 15, 2026",
    createdAt: "2026-01-15T08:00:00.000Z",
    comments: 6,
  },
  {
    id: "art-5",
    slug: "cpace-gordon-college-cfms",
    title: "CPACE Philippines, Gordon College host CFMS exam among graduating students",
    excerpt: "CPACE Philippines has partnered with Gordon College to host the CFMS exam among graduating students, facilitating direct access to credentials…",
    content: `<p>CPACE Philippines has partnered with Gordon College to host the CFMS exam among graduating students, facilitating direct access to professional credentials.</p>
<p>This initiative bridges the gap between traditional academic curricula and modern business requirements. By enabling graduating seniors to earn the Certificate in Financial Management Services (CFMS) alongside their college degree, the program ensures they enter the job market with validated, high-demand skills.</p>
<p>Representatives from both Gordon College and CPACE expressed high expectations for the program's success and its long-term benefits to student employment rates.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/Gordon College  - Dec 12.jpg",
    featured: false,
    date: "December 20, 2025",
    createdAt: "2025-12-20T08:00:00.000Z",
    comments: 9,
  },
  {
    id: "art-6",
    slug: "batstateu-cpace-accord",
    title: "BatStateU, CPACE Philippines seal accord to expand students' career growth",
    excerpt: "CPACE Philippines has signed an accord with BatStateU to expand students' career growth opportunities through globally aligned credentials…",
    content: `<p>CPACE Philippines has signed an accord with BatStateU to expand students' career growth opportunities through globally aligned credentials.</p>
<p>Under this agreement, BatStateU will integrate CPACE certification pathways into their business and technology departments. Students will gain first-hand access to specialized materials and exam seats, facilitating credentials that are highly valued by corporate recruiters.</p>
<p>This partnership reinforces BatStateU's dedication to quality education and future-ready career readiness for all its students.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/BatStateU Dec 2_feature.jpg",
    featured: false,
    date: "December 14, 2025",
    createdAt: "2025-12-14T08:00:00.000Z",
    comments: 11,
  },
  {
    id: "art-7",
    slug: "nemsu-tagbina-cpace-collab",
    title: "NEMSU Tagbina in Mindanao to collab with CPACE Philippines after fruitful first CFMS® exam",
    excerpt: "A fruitful first CFMS® exam paves the way for a lasting collaboration between NEMSU Tagbina and CPACE Philippines…",
    content: `<p>A fruitful first CFMS® exam paves the way for a lasting collaboration between NEMSU Tagbina and CPACE Philippines, extending professional education to Mindanao.</p>
<p>Following the outstanding performance of NEMSU Tagbina students in the recent CFMS exam, both organizations have agreed to establish a continuous framework for certification hosting and training.</p>
<p>This milestone represents a major step forward in making premium professional training accessible to students and instructors in regional educational hubs.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/NEMSU Nov 28.jpg",
    featured: false,
    date: "November 28, 2025",
    createdAt: "2025-11-28T08:00:00.000Z",
    comments: 4,
  },
  {
    id: "art-8",
    slug: "stop-forwarding-emails",
    title: "Stop Forwarding Emails: How cloudHQ Gmail Label Sharing Syncs Your Entire Team",
    excerpt: "In the modern workplace, email remains a cornerstone of communication. Discover how label sharing eliminates forwarding confusion…",
    content: `<p>In the modern workplace, email remains a cornerstone of communication, but forwarding threads can quickly lead to version confusion and lost context. cloudHQ's Gmail Label Sharing changes the game by synchronizing entire labels between team members in real-time.</p>
<p>By sharing a Gmail label, any email sorted into that label automatically appears in your team's folders. This eliminates redundant forwards, speeds up client communication, and ensures all team members have access to up-to-date communication logs without leaving their preferred email client.</p>
<p>Discover how this tech can streamline collaboration and save hours of administrative overhead every week.</p>`,
    category: "Technology",
    categoryColor: "bg-orange-100 text-orange-700 border-orange-200",
    iconName: "globe",
    image: "/assets/articles/CloudHQ Nov 25.jpg",
    featured: false,
    date: "November 12, 2025",
    createdAt: "2025-11-12T08:00:00.000Z",
    comments: 7,
  },
  {
    id: "art-9",
    slug: "cpace-wlc-partnership",
    title: "CPACE Philippines, WLC Partner to Future-Proof Financial Mgmt Curriculum",
    excerpt: "CPACE Philippines has officially signed a partnership with WLC to future-proof the Financial Management curriculum with industry skills…",
    content: `<p>CPACE Philippines has officially signed a partnership with WLC to future-proof the Financial Management curriculum with industry-relevant skills.</p>
<p>The collaboration introduces certified course modules that align with current international practices in corporate finance, budgeting, and risk analysis. By blending theory with practice, WLC students will graduate with the practical tools and credentials needed to excel in competitive finance sectors.</p>
<p>Both institutions aim to raise the bar for financial education and support local businesses with highly competent finance professionals.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/WLC.jpg",
    featured: false,
    date: "October 30, 2025",
    createdAt: "2025-10-30T08:00:00.000Z",
    comments: 5,
  },
  {
    id: "art-10",
    slug: "good-samaritan-colleges-partnership",
    title: "CPACE Philippines Partners with Good Samaritan Colleges to Strengthen Professional Certification Access",
    excerpt: "Good Samaritan Colleges formalizes partnership with CPACE Philippines to provide students with globally aligned microcredential programs…",
    content: `<p>Good Samaritan Colleges has officially partnered with CPACE Philippines to strengthen professional certification access for its students and faculty members.</p>
<p>The partnership was formalized through a signing ceremony, marking a significant milestone in both institutions' commitment to advancing professional education. Students will now have streamlined access to CPACE's suite of certification programs, including the CFMS®, CMMS®, and COMS® credentials.</p>
<p>This collaboration reflects the growing momentum among Philippine educational institutions to integrate industry-recognized certifications into their academic frameworks, ensuring graduates are well-equipped for the demands of the modern workforce.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/Good Samaritan Colleges - June 30.jpg",
    featured: true,
    date: "June 30, 2026",
    createdAt: "2026-06-30T08:00:00.000Z",
    comments: 3,
  },
  {
    id: "art-11",
    slug: "omsc-campuses-partnership-2026",
    title: "OMSC Main and Mamburao Campuses Sign Partnership with CPACE Philippines for 2026",
    excerpt: "Occidental Mindoro State College's Main and Mamburao Campuses enter a new era of professional development through a partnership with CPACE Philippines…",
    content: `<p>Occidental Mindoro State College (OMSC) has expanded its partnership with CPACE Philippines to include both its Main and Mamburao Campuses for the 2026 academic year.</p>
<p>The expanded agreement aims to bring professional certification opportunities closer to students in Occidental Mindoro, addressing the need for accessible and industry-relevant credentials in regional educational institutions.</p>
<p>Through this partnership, OMSC students across both campuses will gain access to certification review programs and credential examinations, further strengthening the college's commitment to producing career-ready graduates.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/OMSC Main and Mamburao Campuses 2026.jpg",
    featured: false,
    date: "June 15, 2026",
    createdAt: "2026-06-15T08:00:00.000Z",
    comments: 4,
  },
  {
    id: "art-12",
    slug: "trimex-colleges-partnership-2026",
    title: "Trimex Colleges and CPACE Philippines Renew Partnership for Expanded Certification Programs in 2026",
    excerpt: "Trimex Colleges renews its partnership with CPACE Philippines, expanding access to professional certification programs for its growing student body…",
    content: `<p>Trimex Colleges has renewed its partnership with CPACE Philippines for 2026, expanding access to professional certification programs for its growing student body.</p>
<p>Building on the success of previous cohorts, the renewed agreement introduces additional certification tracks and enhanced review materials designed to help students achieve higher pass rates on credential examinations.</p>
<p>The partnership underscores both institutions' shared vision of making professional certifications a standard component of higher education, preparing students for competitive careers in finance, management, and operations.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/Trimex 2026.jpg",
    featured: false,
    date: "May 20, 2026",
    createdAt: "2026-05-20T08:00:00.000Z",
    comments: 6,
  },
  {
    id: "art-13",
    slug: "university-of-caloocan-partnership",
    title: "University of Caloocan City and CPACE Philippines Launch Joint Certification Initiative",
    excerpt: "The University of Caloocan City embarks on a new initiative with CPACE Philippines to offer professional certifications alongside academic programs…",
    content: `<p>The University of Caloocan City (UCC) has launched a joint certification initiative with CPACE Philippines, bringing industry-recognized credentials directly to its campus.</p>
<p>The initiative will enable UCC students to pursue CPACE certifications as part of their academic journey, combining theoretical knowledge with practical, industry-aligned skills. Faculty members will also benefit from professional development opportunities through the program.</p>
<p>This partnership reflects UCC's proactive approach to enhancing its educational offerings and ensuring its graduates meet the evolving demands of employers across various sectors.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/UC.jpg",
    featured: false,
    date: "May 5, 2026",
    createdAt: "2026-05-05T08:00:00.000Z",
    comments: 5,
  },
  {
    id: "art-14",
    slug: "ucc-ceremonial-signing-2025",
    title: "UCC Ceremonial Signing Marks Historic Partnership with CPACE Philippines",
    excerpt: "A ceremonial signing between UCC and CPACE Philippines cements a landmark agreement to advance professional education standards…",
    content: `<p>In a landmark ceremony, the University of Caloocan City and CPACE Philippines officially signed a Memorandum of Agreement, formalizing their commitment to advancing professional education standards.</p>
<p>The ceremonial signing was attended by key university administrators and CPACE representatives, highlighting the significance of the partnership for both institutions. The agreement paves the way for integrated certification programs, joint training sessions, and collaborative research in professional education.</p>
<p>Both parties expressed optimism about the partnership's potential to create lasting impact on student career outcomes and institutional academic reputation.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/UCC Ceremonial Signing 2025_1.jpg",
    featured: false,
    date: "April 15, 2026",
    createdAt: "2026-04-15T08:00:00.000Z",
    comments: 8,
  },
  {
    id: "art-15",
    slug: "cmc-cpace-partnership",
    title: "CMC and CPACE Philippines Seal Agreement for Professional Development Programs",
    excerpt: "CMC formalizes its partnership with CPACE Philippines to deliver world-class professional development and certification programs…",
    content: `<p>CMC has officially sealed an agreement with CPACE Philippines to deliver world-class professional development and certification programs to its students and professionals.</p>
<p>The partnership will introduce structured certification pathways aligned with global standards, enabling participants to earn credentials that are recognized across industries. The programs are designed to complement existing academic curricula and provide hands-on, skills-based learning experiences.</p>
<p>This collaboration marks another milestone in CPACE Philippines' growing network of institutional partners committed to elevating professional standards in the country.</p>`,
    category: "Partnership",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconName: "users",
    image: "/assets/articles/CMC.jpg",
    featured: false,
    date: "April 1, 2026",
    createdAt: "2026-04-01T08:00:00.000Z",
    comments: 3,
  },
  {
    id: "art-16",
    slug: "modernizing-finance-insights",
    title: "Modernizing Finance: How Digital Transformation is Reshaping Financial Management",
    excerpt: "As financial institutions embrace digital tools and automation, the role of finance professionals is evolving rapidly. Here's what you need to know…",
    content: `<p>The finance industry is undergoing a seismic shift as digital transformation reshapes traditional practices. From cloud-based accounting platforms to AI-driven financial analytics, professionals must adapt to stay relevant in an increasingly automated landscape.</p>
<p>Key trends include the adoption of robotic process automation (RPA) for routine tasks, the integration of machine learning for predictive financial modeling, and the shift toward real-time reporting dashboards that empower data-driven decision-making.</p>
<p>For finance professionals, this means continuous upskilling is no longer optional—it's essential. Certifications in modern financial management practices can provide the competitive edge needed to thrive in this new era.</p>`,
    category: "Industry Insights",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconName: "trending-up",
    image: "/assets/articles/Modernizing Finance.jpg",
    featured: false,
    date: "March 25, 2026",
    createdAt: "2026-03-25T08:00:00.000Z",
    comments: 10,
  },
  {
    id: "art-17",
    slug: "the-art-of-small-wins",
    title: "The Art of Small Wins: How Incremental Progress Drives Organizational Success",
    excerpt: "Research shows that small, consistent wins have a disproportionate impact on team morale and long-term organizational performance…",
    content: `<p>In the pursuit of ambitious goals, organizations often overlook the power of small wins. Research consistently shows that incremental progress—no matter how minor—has a disproportionate impact on team morale, engagement, and long-term performance.</p>
<p>The "small wins" approach involves breaking down complex objectives into manageable milestones, celebrating each achievement, and using momentum to fuel continued progress. This methodology is particularly effective in change management, where large-scale transformations can feel overwhelming without visible markers of success.</p>
<p>Leaders who master the art of small wins create cultures of continuous improvement, where teams feel empowered, motivated, and aligned with organizational goals.</p>`,
    category: "Industry Insights",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconName: "trending-up",
    image: "/assets/articles/The Art of Small Wins.jpg",
    featured: false,
    date: "March 10, 2026",
    createdAt: "2026-03-10T08:00:00.000Z",
    comments: 7,
  },
  {
    id: "art-18",
    slug: "the-digital-pivot",
    title: "The Digital Pivot: Why Organizations Must Embrace Technology to Stay Competitive",
    excerpt: "The pandemic accelerated digital adoption across industries. Now, the digital pivot is no longer a choice—it's a survival strategy…",
    content: `<p>The global pandemic accelerated digital adoption across every industry, fundamentally changing how organizations operate, communicate, and deliver value. What was once considered a long-term digital strategy became an immediate necessity.</p>
<p>Today, the digital pivot encompasses everything from remote work infrastructure and digital customer experiences to data analytics and cybersecurity frameworks. Organizations that fail to embrace these changes risk falling behind competitors who have already made the transition.</p>
<p>For professionals, this shift creates both challenges and opportunities. Those who invest in digital skills and certifications position themselves at the forefront of their industries, ready to lead in an increasingly technology-driven world.</p>`,
    category: "Industry Insights",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconName: "trending-up",
    image: "/assets/articles/The Digital Pivot.jpg",
    featured: false,
    date: "February 20, 2026",
    createdAt: "2026-02-20T08:00:00.000Z",
    comments: 9,
  },
  {
    id: "art-19",
    slug: "gcash-digital-payments-transformation",
    title: "GCash and the Digital Payments Transformation in the Philippines",
    excerpt: "GCash continues to lead the charge in digital payments, reshaping how Filipinos transact and manage their finances in the digital age…",
    content: `<p>GCash has emerged as a cornerstone of the Philippines' digital payments ecosystem, transforming how millions of Filipinos handle everyday transactions. From mobile payments and fund transfers to investments and insurance, the platform has expanded far beyond its original scope.</p>
<p>The rapid adoption of digital wallets like GCash reflects a broader shift in the Philippine financial landscape, where cash-heavy transactions are giving way to seamless, technology-driven alternatives. This transformation is creating new opportunities for fintech professionals and financial managers alike.</p>
<p>As digital payments continue to evolve, professionals equipped with modern financial management skills and certifications will be best positioned to navigate and lead in this dynamic sector.</p>`,
    category: "Technology",
    categoryColor: "bg-orange-100 text-orange-700 border-orange-200",
    iconName: "globe",
    image: "/assets/articles/GCash.jpg",
    featured: false,
    date: "February 1, 2026",
    createdAt: "2026-02-01T08:00:00.000Z",
    comments: 14,
  },
]

export function getAllArticles(): Article[] {
  return articlesData
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articlesData.find((a) => a.slug === slug)
}
