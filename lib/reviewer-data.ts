export interface ReviewerItem {
  id: string
  order: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  keyConcept: string
  formula?: string | null
}

export interface CourseReviewer {
  programCode: "CFMS" | "CMMS" | "COMS"
  programName: string
  title: string
  overview: string
  domains: string[]
  items: ReviewerItem[]
}

// ==========================================
// 1. CFMS REVIEWER (FINANCIAL MANAGEMENT)
// ==========================================
export const cfmsReviewerItems: ReviewerItem[] = [
  {
    id: "cfms-rev-1",
    order: 1,
    question: "Which statement reflects cash receipts and disbursements over a reporting period?",
    options: ["Balance Sheet", "Income Statement", "Statement of Cash Flows", "Statement of Equity"],
    correctAnswer: "Statement of Cash Flows",
    explanation: "The Statement of Cash Flows reports the gross inflows and outflows of cash categorized into operating, investing, and financing activities during an accounting period.",
    keyConcept: "Cash Flow Reporting",
    formula: "Net Cash Flow = Cash from Operations + Cash from Investing + Cash from Financing"
  },
  {
    id: "cfms-rev-2",
    order: 2,
    question: "If Current Assets are ₱500,000 and Current Liabilities are ₱250,000, what is the Current Ratio?",
    options: ["1.5", "2.0", "0.5", "2.5"],
    correctAnswer: "2.0",
    explanation: "The Current Ratio evaluates short-term liquidity by dividing Total Current Assets by Total Current Liabilities: ₱500,000 / ₱250,000 = 2.0x.",
    keyConcept: "Liquidity Ratio",
    formula: "Current Ratio = Current Assets / Current Liabilities"
  },
  {
    id: "cfms-rev-3",
    order: 3,
    question: "Which of the following is considered an asset?",
    options: ["Accounts Payable", "Accounts Receivable", "Accrued Wages", "Unearned Revenue"],
    correctAnswer: "Accounts Receivable",
    explanation: "Accounts Receivable represents legally enforceable claims for money owed to the business by customers for goods/services delivered on credit. Payables and Unearned Revenue are liabilities.",
    keyConcept: "Asset Classification",
    formula: null
  },
  {
    id: "cfms-rev-4",
    order: 4,
    question: "Depreciation is categorized on the statement of cash flows as an adjustment that is:",
    options: ["Added back to Net Income in operating activities", "Subtracted from Net Income in financing activities", "Ignored as it has no tax impact", "Included in cash flows from investing activities"],
    correctAnswer: "Added back to Net Income in operating activities",
    explanation: "Under the indirect method, depreciation is a non-cash expense that reduced net income on the income statement, so it must be added back to net income to arrive at operating cash flow.",
    keyConcept: "Operating Cash Flow Adjustments",
    formula: "Operating Cash Flow = Net Income + Non-Cash Expenses (Depreciation/Amortization) - Δ Working Capital"
  },
  {
    id: "cfms-rev-5",
    order: 5,
    question: "A project has an initial cost of ₱100,000 and returns ₱25,000 annually. What is its payback period?",
    options: ["3 years", "4 years", "5 years", "2.5 years"],
    correctAnswer: "4 years",
    explanation: "The payback period is calculated as Initial Outlay / Annual Cash Inflow = ₱100,000 / ₱25,000 = 4.0 years.",
    keyConcept: "Capital Budgeting — Payback Period",
    formula: "Payback Period = Initial Outlay / Constant Annual Cash Inflow"
  },
  {
    id: "cfms-rev-6",
    order: 6,
    question: "A project with a positive Net Present Value (NPV) is expected to add value to the firm.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "An NPV greater than zero means the present value of future cash inflows exceeds the initial investment outlay when discounted at the firm's cost of capital, thereby increasing shareholder wealth.",
    keyConcept: "NPV Decision Rule",
    formula: "NPV = Σ [CF_t / (1 + r)^t] - Initial Investment > 0"
  },
  {
    id: "cfms-rev-7",
    order: 7,
    question: "Liquidity refers to how quickly an asset can be converted into cash without significant loss of value.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Liquidity has two key dimensions: speed of conversion to cash and preservation of purchasing power/market value without substantial price concessions.",
    keyConcept: "Liquidity Definition",
    formula: null
  },
  {
    id: "cfms-rev-8",
    order: 8,
    question: "Which of the following costs does NOT change with changes in production volume within the relevant range?",
    options: ["Direct materials", "Factory lease rent", "Sales commission", "Packaging supplies"],
    correctAnswer: "Factory lease rent",
    explanation: "Fixed costs like factory lease rent remain constant in total regardless of output volume within the relevant range, while variable costs change in direct proportion to production.",
    keyConcept: "Cost Behavior (Fixed vs Variable)",
    formula: "Total Cost = Total Fixed Costs + (Variable Cost per Unit × Output Volume)"
  },
  {
    id: "cfms-rev-9",
    order: 9,
    question: "What happens to the break-even point if selling price per unit increases while variable and fixed costs remain constant?",
    options: ["Break-even point increases", "Break-even point decreases", "Break-even point remains unchanged", "Break-even point becomes zero immediately"],
    correctAnswer: "Break-even point decreases",
    explanation: "Increasing the selling price increases the contribution margin per unit (Price - Variable Cost). Because each unit contributes more toward fixed costs, fewer units are needed to break even.",
    keyConcept: "Cost-Volume-Profit (CVP) Analysis",
    formula: "Break-even Units = Fixed Costs / (Selling Price - Variable Cost per Unit)"
  },
  {
    id: "cfms-rev-10",
    order: 10,
    question: "Working capital equals:",
    options: ["Total Assets - Total Debt", "Current Assets - Current Liabilities", "Cash - Accounts Payable", "Revenue - Expenses"],
    correctAnswer: "Current Assets - Current Liabilities",
    explanation: "Net Working Capital (NWC) measures a company's operating liquidity and short-term financial health: Current Assets minus Current Liabilities.",
    keyConcept: "Working Capital Management",
    formula: "Net Working Capital (NWC) = Current Assets - Current Liabilities"
  },
  {
    id: "cfms-rev-11",
    order: 11,
    question: "Which ratio evaluates profitability relative to total sales revenue?",
    options: ["Debt Ratio", "Net Profit Margin", "Current Ratio", "Asset Turnover"],
    correctAnswer: "Net Profit Margin",
    explanation: "Net Profit Margin expresses Net Income as a percentage of Net Revenue, indicating how many cents of profit are generated from each peso of sales.",
    keyConcept: "Profitability Ratios",
    formula: "Net Profit Margin = (Net Income / Net Sales Revenue) × 100%"
  },
  {
    id: "cfms-rev-12",
    order: 12,
    question: "In financial math, the concept that a peso today is worth more than a peso in the future is known as:",
    options: ["Opportunity Cost", "Time Value of Money", "Purchasing Power Parity", "Capital Rationing"],
    correctAnswer: "Time Value of Money",
    explanation: "The Time Value of Money (TVM) reflects that money received today has earning capacity through investment or interest, plus protection against future inflation.",
    keyConcept: "Time Value of Money (TVM)",
    formula: "FV = PV × (1 + r)^n | PV = FV / (1 + r)^n"
  },
  {
    id: "cfms-rev-13",
    order: 13,
    question: "Variable costs per unit decrease as production volume increases.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Variable cost PER UNIT remains constant within the relevant range. It is FIXED cost per unit that decreases as volume increases due to economies of scale spreading fixed costs.",
    keyConcept: "Unit Cost Dynamics",
    formula: null
  },
  {
    id: "cfms-rev-14",
    order: 14,
    question: "The Quick Ratio includes inventory in its numerator calculation.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "The Quick Ratio (Acid-Test) intentionally excludes inventory and prepayments from current assets because inventory is the least liquid current asset and may require discounting to liquidate quickly.",
    keyConcept: "Acid-Test Ratio",
    formula: "Quick Ratio = (Cash + Marketable Securities + Accounts Receivable) / Current Liabilities"
  },
  {
    id: "cfms-rev-15",
    order: 15,
    question: "Which ratio is calculated as Net Income divided by Total Shareholders' Equity?",
    options: ["Return on Equity (ROE)", "Return on Assets (ROA)", "Gross Margin", "Debt-to-Equity Ratio"],
    correctAnswer: "Return on Equity (ROE)",
    explanation: "ROE measures the efficiency with which a firm generates profits from the equity capital invested by shareholders.",
    keyConcept: "Return on Equity",
    formula: "ROE = Net Income / Total Stockholders' Equity"
  },
  {
    id: "cfms-rev-16",
    order: 16,
    question: "What is a budget variance?",
    options: ["The difference between actual financial performance and budgeted figures", "The fee charged by accounting software", "The total income tax owed to BIR", "The interest paid to commercial lenders"],
    correctAnswer: "The difference between actual financial performance and budgeted figures",
    explanation: "Variance analysis compares actual revenues or costs with planned projections to pinpoint operational discrepancies and guide managerial control.",
    keyConcept: "Budgetary Control",
    formula: "Variance = Actual Result - Budgeted Figure"
  },
  {
    id: "cfms-rev-17",
    order: 17,
    question: "If actual expenses exceed budgeted expenses, the variance is described as:",
    options: ["Favorable", "Unfavorable (Adverse)", "Neutral", "Provisional"],
    correctAnswer: "Unfavorable (Adverse)",
    explanation: "For costs and expenses, when actual spending exceeds the planned budget, it reduces profitability and is classified as Unfavorable (U).",
    keyConcept: "Variance Classification",
    formula: null
  },
  {
    id: "cfms-rev-18",
    order: 18,
    question: "Which inventory method results in higher ending inventory value during periods of rising prices?",
    options: ["FIFO", "LIFO", "Average Cost", "Specific Identification"],
    correctAnswer: "FIFO",
    explanation: "Under FIFO (First-In, First-Out), older, lower-cost inventory is charged to Cost of Goods Sold, leaving newer, higher-priced inventory on the balance sheet.",
    keyConcept: "Inventory Valuation Models",
    formula: null
  },
  {
    id: "cfms-rev-19",
    order: 19,
    question: "A company's capital structure consists of:",
    options: ["Only short-term trade credit", "Its mix of long-term debt and equity financing", "Its physical factory buildings and land", "Its executive management hierarchy"],
    correctAnswer: "Its mix of long-term debt and equity financing",
    explanation: "Capital structure refers to the proportion of debt (bonds, bank loans) and equity (common stock, preferred stock, retained earnings) used to fund long-term operations and growth.",
    keyConcept: "Capital Structure",
    formula: "Debt-to-Capital = Debt / (Debt + Equity)"
  },
  {
    id: "cfms-rev-20",
    order: 20,
    question: "What is the primary document used to track anticipated daily or weekly cash flows?",
    options: ["Cash Budget", "Balance Sheet", "Depreciation Schedule", "Tax Return"],
    correctAnswer: "Cash Budget",
    explanation: "A cash budget forecasts expected cash receipts and disbursements over short intervals to prevent liquidity shortfalls or optimize idle cash balances.",
    keyConcept: "Cash Forecasting",
    formula: "Ending Cash = Beginning Cash + Inflows - Outflows"
  },
  {
    id: "cfms-rev-21",
    order: 21,
    question: "Retained earnings represent cumulative net income that has not been distributed as dividends.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Retained earnings are the cumulative net earnings reinvested into the firm after subtracting all cash and stock dividends paid to shareholders since inception.",
    keyConcept: "Retained Earnings Equity",
    formula: "Ending Retained Earnings = Beginning Retained Earnings + Net Income - Dividends"
  },
  {
    id: "cfms-rev-22",
    order: 22,
    question: "An adverse revenue variance means actual sales were higher than projected sales.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "For revenue, actual sales higher than budget is FAVORABLE. Adverse (unfavorable) revenue variance occurs when actual sales fall below budgeted revenue.",
    keyConcept: "Revenue Variance Interpretation",
    formula: null
  },
  {
    id: "cfms-rev-23",
    order: 23,
    question: "Which of the following is considered a current liability?",
    options: ["Accounts Payable", "Patents", "Equipment", "Common Stock"],
    correctAnswer: "Accounts Payable",
    explanation: "Current liabilities are debts and obligations expected to be settled within one year or one operating cycle using current assets or the creation of other current liabilities.",
    keyConcept: "Liabilities Classification",
    formula: null
  },
  {
    id: "cfms-rev-24",
    order: 24,
    question: "Gross Profit is calculated as:",
    options: ["Net Sales minus Cost of Goods Sold (COGS)", "EBIT minus Tax Expense", "Operating Income minus Interest", "Total Assets minus Liabilities"],
    correctAnswer: "Net Sales minus Cost of Goods Sold (COGS)",
    explanation: "Gross profit represents revenue remaining after subtracting direct production costs (COGS), before deducting selling, general, and administrative operating expenses.",
    keyConcept: "Gross Profit Metric",
    formula: "Gross Profit = Net Sales - COGS"
  },
  {
    id: "cfms-rev-25",
    order: 25,
    question: "Operating Income is also commonly referred to as:",
    options: ["Net Income", "EBIT (Earnings Before Interest and Taxes)", "Gross Margin", "Retained Earnings"],
    correctAnswer: "EBIT (Earnings Before Interest and Taxes)",
    explanation: "Operating Income reflects the core earnings generated strictly from recurring operations before financial financing costs (interest) and government taxation.",
    keyConcept: "Operating Income / EBIT",
    formula: "EBIT = Gross Profit - Operating Expenses (SG&A + R&D + Depreciation)"
  },
  {
    id: "cfms-rev-26",
    order: 26,
    question: "The Cost of Goods Sold includes:",
    options: ["Administrative executive salaries", "Direct materials, direct labor, and manufacturing overhead", "Marketing and advertising expenses", "Corporate income taxes"],
    correctAnswer: "Direct materials, direct labor, and manufacturing overhead",
    explanation: "COGS encompasses all direct expenses necessary to manufacture a product: raw direct materials, line factory labor, and allocated plant overhead.",
    keyConcept: "Product Costing",
    formula: "COGS = Beginning Inventory + Net Purchases - Ending Inventory"
  },
  {
    id: "cfms-rev-27",
    order: 27,
    question: "An investment of ₱10,000 earns 10% simple interest annually for 3 years. Total interest earned is:",
    options: ["₱1,000", "₱3,000", "₱3,310", "₱2,500"],
    correctAnswer: "₱3,000",
    explanation: "Simple interest calculates return only on the principal amount: Interest = Principal × Rate × Time = ₱10,000 × 0.10 × 3 = ₱3,000. (₱3,310 would be compound interest).",
    keyConcept: "Simple vs Compound Interest",
    formula: "Simple Interest = P × r × t"
  },
  {
    id: "cfms-rev-28",
    order: 28,
    question: "What does solvency refer to?",
    options: ["Ability to pay short-term obligations within 30 days", "Ability to meet long-term financial commitments and survive indefinitely", "Speed of collecting invoices from customers", "Daily cash in the bank register"],
    correctAnswer: "Ability to meet long-term financial commitments and survive indefinitely",
    explanation: "Solvency gauges a firm's capacity to service its long-term debt liabilities and maintain ongoing viability, whereas liquidity concerns immediate, short-term debt.",
    keyConcept: "Solvency vs Liquidity",
    formula: "Debt-to-Assets = Total Liabilities / Total Assets"
  },
  {
    id: "cfms-rev-29",
    order: 29,
    question: "Accounts Receivable represents money owed to the company by its customers for credit sales.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Trade receivables arise from providing goods or services to buyers on terms without requiring immediate upfront cash payment.",
    keyConcept: "Credit Management",
    formula: "Days Sales Outstanding (DSO) = (Accounts Receivable / Total Credit Sales) × 365"
  },
  {
    id: "cfms-rev-30",
    order: 30,
    question: "Which financial metric divides Operating Cash Flow by Total Debt to check debt servicing capacity?",
    options: ["Operating Cash Flow Ratio", "Inventory Turnover", "Current Ratio", "Gross Margin"],
    correctAnswer: "Operating Cash Flow Ratio",
    explanation: "Cash flow coverage ratios determine whether the cash generated from day-to-day operations is sufficient to service debt obligations without asset liquidations.",
    keyConcept: "Cash Flow Solvency Ratios",
    formula: "Cash Flow to Debt = Operating Cash Flow / Total Debt"
  }
]

// ==========================================
// 2. CMMS REVIEWER (MARKETING MANAGEMENT)
// ==========================================
export const cmmsReviewerItems: ReviewerItem[] = [
  {
    id: "cmms-rev-1",
    order: 1,
    question: "What are the traditional 4 Ps of the Marketing Mix?",
    options: ["Product, Price, Place, Promotion", "People, Process, Physical Evidence, Profit", "Positioning, Packaging, Planning, Pitch", "Product, People, Pipeline, Performance"],
    correctAnswer: "Product, Price, Place, Promotion",
    explanation: "Proposed by E. Jerome McCarthy, the 4 Ps form the foundational marketing mix framework for tangible goods: Product, Price, Place, and Promotion.",
    keyConcept: "The 4 Ps Marketing Mix",
    formula: null
  },
  {
    id: "cmms-rev-2",
    order: 2,
    question: "Which 3 additional Ps were introduced to create the 7 Ps for service marketing?",
    options: ["Profit, Performance, Purpose", "People, Process, Physical Evidence", "Positioning, Publicity, Perception", "Partnership, Policy, Presence"],
    correctAnswer: "People, Process, Physical Evidence",
    explanation: "Booms and Bitner added People (service personnel), Process (service delivery mechanics), and Physical Evidence (tangible cues/environment) to address service intangibility.",
    keyConcept: "The 7 Ps Service Marketing Mix",
    formula: null
  },
  {
    id: "cmms-rev-3",
    order: 3,
    question: "In the STP marketing framework, what does 'STP' stand for?",
    options: ["Sales, Target, Promotion", "Segmentation, Targeting, Positioning", "Strategy, Tactics, Planning", "Sourcing, Trading, Pricing"],
    correctAnswer: "Segmentation, Targeting, Positioning",
    explanation: "STP is the core strategic marketing process: Segmenting the market into distinct groups, Targeting the most attractive segments, and Positioning the offering distinctively.",
    keyConcept: "STP Strategic Marketing",
    formula: null
  },
  {
    id: "cmms-rev-4",
    order: 4,
    question: "Dividing a consumer market by age, income, gender, and education is called:",
    options: ["Geographic segmentation", "Psychographic segmentation", "Demographic segmentation", "Behavioral segmentation"],
    correctAnswer: "Demographic segmentation",
    explanation: "Demographics categorize populations by statistical traits such as age, gender, household income, marital status, and educational attainment.",
    keyConcept: "Demographic Segmentation",
    formula: null
  },
  {
    id: "cmms-rev-5",
    order: 5,
    question: "Which pricing strategy sets an initially high price to capture consumer surplus before lowering it over time?",
    options: ["Penetration Pricing", "Price Skimming", "Freemium Pricing", "Cost-Plus Pricing"],
    correctAnswer: "Price Skimming",
    explanation: "Price Skimming targets early adopters willing to pay a premium for novel technology or exclusivity before gradually dropping the price to capture price-sensitive segments.",
    keyConcept: "Price Skimming Strategy",
    formula: null
  },
  {
    id: "cmms-rev-6",
    order: 6,
    question: "Penetration pricing involves launching a product at a low price to quickly gain market share.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Penetration pricing sacrifices initial profit margins to rapidly build market share, induce trial, generate word-of-mouth, and create barriers for competitors.",
    keyConcept: "Penetration Pricing",
    formula: null
  },
  {
    id: "cmms-rev-7",
    order: 7,
    question: "Brand Equity refers to the commercial value derived from consumer perception of a brand name rather than the product itself.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Brand Equity represents the premium value, loyalty, and customer goodwill commanded by a recognized brand compared to an unbranded generic equivalent.",
    keyConcept: "Brand Equity",
    formula: null
  },
  {
    id: "cmms-rev-8",
    order: 8,
    question: "What does Customer Lifetime Value (CLV or LTV) measure?",
    options: ["The total profit attributed to the entire future relationship with a customer", "The cost to acquire one new customer", "The total sales of a single transaction", "The annual marketing department payroll"],
    correctAnswer: "The total profit attributed to the entire future relationship with a customer",
    explanation: "Customer Lifetime Value projects the aggregate net profit contribution expected from a customer across the entire duration of their commercial relationship.",
    keyConcept: "Customer Lifetime Value (LTV)",
    formula: "LTV = (Average Order Value × Purchase Frequency × Gross Margin) / Churn Rate"
  },
  {
    id: "cmms-rev-9",
    order: 9,
    question: "If a marketing campaign costs ₱50,000 and acquires 100 paying customers, what is the Customer Acquisition Cost (CAC)?",
    options: ["₱200", "₱500", "₱1,000", "₱5,000"],
    correctAnswer: "₱500",
    explanation: "CAC is calculated by dividing total acquisition marketing expenditure by the total number of customers acquired: ₱50,000 / 100 = ₱500 per customer.",
    keyConcept: "Customer Acquisition Cost (CAC)",
    formula: "CAC = Total Acquisition Expenses / Total New Customers Acquired"
  },
  {
    id: "cmms-rev-10",
    order: 10,
    question: "What is the primary metric indicating healthy SaaS or subscription unit economics?",
    options: ["CAC is three times higher than LTV", "LTV is at least three times higher than CAC (LTV:CAC ≥ 3:1)", "CAC equals zero", "Churn rate is 100%"],
    correctAnswer: "LTV is at least three times higher than CAC (LTV:CAC ≥ 3:1)",
    explanation: "An LTV:CAC ratio of 3:1 or higher indicates that customer value comfortably covers acquisition costs while leaving substantial margin for operating overhead and profit.",
    keyConcept: "LTV to CAC Ratio",
    formula: "Target Ratio: LTV / CAC ≥ 3.0"
  },
  {
    id: "cmms-rev-11",
    order: 11,
    question: "Which digital marketing channel relies on optimizing web content to rank organically in search engine result pages?",
    options: ["Pay-Per-Click (PPC)", "Search Engine Optimization (SEO)", "Affiliate Marketing", "Cold Emailing"],
    correctAnswer: "Search Engine Optimization (SEO)",
    explanation: "SEO optimizes on-page structure, technical site health, keywords, and backlink authority to earn non-paid, organic rankings on Google and other search engines.",
    keyConcept: "Search Engine Optimization (SEO)",
    formula: null
  },
  {
    id: "cmms-rev-12",
    order: 12,
    question: "In the consumer decision-making process, what is typically the first stage?",
    options: ["Alternative Evaluation", "Purchase Decision", "Problem / Need Recognition", "Information Search"],
    correctAnswer: "Problem / Need Recognition",
    explanation: "The consumer journey starts when a consumer recognizes an unfulfilled need or gap between their current state and a desired state, stimulated by internal or external triggers.",
    keyConcept: "Consumer Buying Process",
    formula: "Need Recognition → Information Search → Evaluation → Purchase → Post-Purchase"
  },
  {
    id: "cmms-rev-13",
    order: 13,
    question: "A high bounce rate on an e-commerce product landing page generally indicates strong visitor engagement.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Bounce rate measures the percentage of visitors who leave after viewing only a single page without taking action. A high bounce rate typically signals mismatched expectations or weak calls-to-action.",
    keyConcept: "Digital Analytics Metrics",
    formula: "Bounce Rate = (Single Page Visits / Total Visits) × 100%"
  },
  {
    id: "cmms-rev-14",
    order: 14,
    question: "Which concept describes a detailed composite sketch of an ideal target customer based on research and data?",
    options: ["Buyer Persona", "Market Swot", "Sales Funnel", "Product Roadmap"],
    correctAnswer: "Buyer Persona",
    explanation: "A Buyer Persona is a semi-fictional archetype of a company's target buyer embodying demographics, behaviors, motivations, pain points, and decision criteria.",
    keyConcept: "Buyer Personas",
    formula: null
  },
  {
    id: "cmms-rev-15",
    order: 15,
    question: "Return on Ad Spend (ROAS) is calculated as:",
    options: ["Revenue Generated from Ads divided by Total Advertising Cost", "Total Ad Spend divided by Impressions", "Net Income minus Ad Costs", "Click-Through Rate times Conversion Rate"],
    correctAnswer: "Revenue Generated from Ads divided by Total Advertising Cost",
    explanation: "ROAS gauges direct advertising effectiveness: ROAS = Ad Revenue / Ad Spend. For example, ₱40,000 revenue generated from ₱10,000 ad spend represents a 4x (400%) ROAS.",
    keyConcept: "Return on Ad Spend (ROAS)",
    formula: "ROAS = Revenue from Ad Campaign / Cost of Ad Campaign"
  },
  {
    id: "cmms-rev-16",
    order: 16,
    question: "What is the primary objective of A/B split testing in digital campaigns?",
    options: ["To test two variations against each other to identify which produces superior conversion performance", "To replace marketing staff with algorithms", "To guarantee zero ad budget waste", "To publish double the advertisements"],
    correctAnswer: "To test two variations against each other to identify which produces superior conversion performance",
    explanation: "A/B testing exposes randomized segments of audience traffic to two variants (A vs B) of a creative, headline, or call-to-action to isolate which element maximizes conversion rate.",
    keyConcept: "Conversion Rate Optimization (CRO)",
    formula: null
  },
  {
    id: "cmms-rev-17",
    order: 17,
    question: "Which of the following is considered an earned media channel?",
    options: ["Company-owned corporate website", "Paid Instagram carousel ad", "Unsolicited viral coverage by a news outlet", "Sponsored newsletter blast"],
    correctAnswer: "Unsolicited viral coverage by a news outlet",
    explanation: "In the POEM framework (Paid, Owned, Earned Media), Earned Media includes organic PR, word-of-mouth reviews, press features, and viral social shares earned naturally.",
    keyConcept: "POEM Media Framework",
    formula: null
  },
  {
    id: "cmms-rev-18",
    order: 18,
    question: "Cognitive dissonance in marketing is most commonly experienced during which stage?",
    options: ["Pre-purchase information search", "Initial need recognition", "Post-purchase evaluation (buyer's remorse)", "Wholesale distributor negotiation"],
    correctAnswer: "Post-purchase evaluation (buyer's remorse)",
    explanation: "Cognitive dissonance occurs post-purchase when a buyer feels psychological tension, doubt, or second thoughts regarding whether they made the right purchasing choice.",
    keyConcept: "Post-Purchase Behavior",
    formula: null
  },
  {
    id: "cmms-rev-19",
    order: 19,
    question: "Market cannibalization occurs when a new product launched by a firm takes sales away from its own existing products.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Cannibalization occurs when introducing an internal product line extension captures demand from the company's existing offerings rather than expanding total market share.",
    keyConcept: "Product Line Management",
    formula: null
  },
  {
    id: "cmms-rev-20",
    order: 20,
    question: "Which metric tracks the percentage of users who cancel or fail to renew their subscription over a given period?",
    options: ["Churn Rate", "Net Promoter Score", "Click-Through Rate", "Gross Margin"],
    correctAnswer: "Churn Rate",
    explanation: "Customer Churn Rate calculates the proportion of subscribers or customers who discontinue their service during a specified period.",
    keyConcept: "Retention & Churn Analytics",
    formula: "Churn Rate = (Customers Lost during Period / Customers at Start of Period) × 100%"
  },
  {
    id: "cmms-rev-21",
    order: 21,
    question: "A Net Promoter Score (NPS) categorizes customers into:",
    options: ["Promoters, Passives, and Detractors", "Buyers, Browsers, and Leavers", "High Value, Mid Value, and Low Value", "Leaders, Followers, and Challengers"],
    correctAnswer: "Promoters, Passives, and Detractors",
    explanation: "NPS asks how likely a customer is to recommend the company on a 0-10 scale: Promoters (9-10), Passives (7-8), and Detractors (0-6).",
    keyConcept: "Customer Satisfaction (NPS)",
    formula: "NPS = % Promoters - % Detractors (ranges from -100 to +100)"
  },
  {
    id: "cmms-rev-22",
    order: 22,
    question: "What is guerrilla marketing characterized by?",
    options: ["Multi-million dollar Super Bowl television commercials", "Unconventional, high-impact, low-cost marketing tactics designed for maximum viral buzz", "Standard direct mail flyers sent to homeowners", "Government billboard campaigns"],
    correctAnswer: "Unconventional, high-impact, low-cost marketing tactics designed for maximum viral buzz",
    explanation: "Guerrilla marketing leverages creativity, surprise, and experiential engagement rather than immense media spending to generate massive public and social media attention.",
    keyConcept: "Guerrilla Marketing Strategy",
    formula: null
  },
  {
    id: "cmms-rev-23",
    order: 23,
    question: "The top of the marketing funnel (TOFU) primarily focuses on generating:",
    options: ["Repeat purchases", "Brand awareness and initial discovery", "Contract signatures", "Post-purchase loyalty advocacy"],
    correctAnswer: "Brand awareness and initial discovery",
    explanation: "Top-of-Funnel (TOFU) strategies target broad prospects to create brand recognition and draw potential buyers into the consideration pipeline.",
    keyConcept: "Marketing Funnel Stages",
    formula: "TOFU (Awareness) → MOFU (Consideration) → BOFU (Conversion)"
  },
  {
    id: "cmms-rev-24",
    order: 24,
    question: "Which pricing strategy involves setting prices ending in .99 or .95 to make goods appear cheaper?",
    options: ["Psychological / Charm Pricing", "Cost-Plus Pricing", "Bundle Pricing", "Dynamic Pricing"],
    correctAnswer: "Psychological / Charm Pricing",
    explanation: "Charm pricing leverages the left-digit effect, where consumers mentally round ₱999 down to ₱900 rather than recognizing it is virtually ₱1,000.",
    keyConcept: "Psychological Pricing",
    formula: null
  },
  {
    id: "cmms-rev-25",
    order: 25,
    question: "Influencer marketing is effective primarily because it leverages established trust and social proof with niche communities.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Consumers place elevated trust in content creators and industry figures they follow regularly, giving recommendations higher credibility than direct brand advertising.",
    keyConcept: "Social Proof & Influence",
    formula: null
  },
  {
    id: "cmms-rev-26",
    order: 26,
    question: "What does Click-Through Rate (CTR) measure in online advertising?",
    options: ["The percentage of people who clicked an ad out of total people who viewed it (impressions)", "The total dollars spent per click", "The percentage of visitors who purchased on the website", "The length of time spent on the page"],
    correctAnswer: "The percentage of people who clicked an ad out of total people who viewed it (impressions)",
    explanation: "CTR assesses ad relevance and creative appeal: CTR = (Total Clicks / Total Impressions) × 100%.",
    keyConcept: "Click-Through Rate (CTR)",
    formula: "CTR = (Clicks / Impressions) × 100%"
  },
  {
    id: "cmms-rev-27",
    order: 27,
    question: "In the BCG Matrix, products with high market growth rate and high market share are classified as:",
    options: ["Cash Cows", "Dogs", "Stars", "Question Marks"],
    correctAnswer: "Stars",
    explanation: "In the Boston Consulting Group (BCG) growth-share matrix: Stars have high market share in rapidly expanding markets, generating high revenue while requiring ongoing investment.",
    keyConcept: "BCG Portfolio Matrix",
    formula: null
  },
  {
    id: "cmms-rev-28",
    order: 28,
    question: "Cash Cows in the BCG Matrix generate substantial surplus cash while requiring minimal reinvestment due to mature market conditions.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Cash Cows have dominant market share in mature, low-growth industries. They produce steady, dependable cash flows used to fund innovation and stars.",
    keyConcept: "BCG Matrix — Cash Cows",
    formula: null
  },
  {
    id: "cmms-rev-29",
    order: 29,
    question: "What is remarketing / retargeting in digital marketing?",
    options: ["Serving ads specifically to users who previously visited your website or engaged with your brand", "Cold calling random residential telephone listings", "Printing duplicate magazine advertisements", "Creating a brand new corporate logo"],
    correctAnswer: "Serving ads specifically to users who previously visited your website or engaged with your brand",
    explanation: "Retargeting uses cookie pixels or customer lists to re-engage past visitors who did not convert on their first visit, yielding substantially higher conversion rates.",
    keyConcept: "Retargeting Campaigns",
    formula: null
  },
  {
    id: "cmms-rev-30",
    order: 30,
    question: "A unique selling proposition (USP) defines:",
    options: ["The distinct feature or benefit that sets a product apart from all competitors in the consumer's mind", "The legal registered trademark registration number", "The factory wholesale minimum order quantity", "The standard retail tax clearance certificate"],
    correctAnswer: "The distinct feature or benefit that sets a product apart from all competitors in the consumer's mind",
    explanation: "A USP communicates the specific, compelling reason why a prospect should choose your offering over all market alternatives.",
    keyConcept: "Unique Value Proposition (UVP/USP)",
    formula: null
  }
]

// ==========================================
// 3. COMS REVIEWER (OPERATIONS MANAGEMENT)
// ==========================================
export const comsReviewerItems: ReviewerItem[] = [
  {
    id: "coms-rev-1",
    order: 1,
    question: "What does the Economic Order Quantity (EOQ) formula seek to minimize?",
    options: ["Total sales commission", "Total cost of ordering and holding inventory", "Total customer delivery distance", "Total employee overtime expenses"],
    correctAnswer: "Total cost of ordering and holding inventory",
    explanation: "EOQ determines the optimal batch size that balances fixed ordering costs with inventory carrying/holding costs to minimize total annual inventory costs.",
    keyConcept: "Economic Order Quantity (EOQ)",
    formula: "EOQ = √[(2 × Demand × Order Cost) / Holding Cost per Unit]"
  },
  {
    id: "coms-rev-2",
    order: 2,
    question: "In operations, Just-in-Time (JIT) production aims to:",
    options: ["Maximize warehouse safety stock levels", "Eliminate waste by producing goods only when needed in the exact quantity demanded", "Order raw materials one year in advance", "Increase scrap and rework tolerance"],
    correctAnswer: "Eliminate waste by producing goods only when needed in the exact quantity demanded",
    explanation: "Developed in the Toyota Production System, JIT synchronizes production directly with actual customer demand, eliminating excessive inventory, storage overhead, and obsolescence.",
    keyConcept: "Just-In-Time (JIT) Manufacturing",
    formula: null
  },
  {
    id: "coms-rev-3",
    order: 3,
    question: "The Six Sigma methodology targets a defect rate of no more than:",
    options: ["3.4 defects per million opportunities (DPMO)", "34 defects per thousand opportunities", "340 defects per hundred opportunities", "10% defect rate across all runs"],
    correctAnswer: "3.4 defects per million opportunities (DPMO)",
    explanation: "Six Sigma represents 6 standard deviations between process mean and nearest specification limit, translating statistically to 99.99966% defect-free output or 3.4 DPMO.",
    keyConcept: "Six Sigma Standards",
    formula: "DPMO = (Total Defects / [Total Units × Opportunities per Unit]) × 1,000,000"
  },
  {
    id: "coms-rev-4",
    order: 4,
    question: "What are the five phases of the Six Sigma improvement cycle?",
    options: ["Design, Manufacture, Assemble, Inspect, Ship", "Define, Measure, Analyze, Improve, Control (DMAIC)", "Develop, Market, Apply, Iterate, Complete", "Discover, Model, Automate, Integrate, Check"],
    correctAnswer: "Define, Measure, Analyze, Improve, Control (DMAIC)",
    explanation: "DMAIC is the standard data-driven problem-solving methodology used in Six Sigma to optimize and stabilize existing business and operational processes.",
    keyConcept: "Six Sigma DMAIC Roadmap",
    formula: null
  },
  {
    id: "coms-rev-5",
    order: 5,
    question: "In the Japanese 5S methodology for workplace organization, what are the 5 S's (English equivalents)?",
    options: ["Sort, Set in order, Shine, Standardize, Sustain", "Speed, Strength, Safety, Supply, Service", "Source, Select, Store, Sell, Ship", "Supervise, Schedule, Structure, Secure, Solve"],
    correctAnswer: "Sort, Set in order, Shine, Standardize, Sustain",
    explanation: "5S originates from Seiri (Sort), Seiton (Set in order), Seiso (Shine), Seiketsu (Standardize), and Shitsuke (Sustain) to maintain an efficient, clean, and safe workplace.",
    keyConcept: "5S Workplace Optimization",
    formula: null
  },
  {
    id: "coms-rev-6",
    order: 6,
    question: "A bottleneck in a production process is defined as the stage with the lowest effective capacity that limits overall throughput.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "By the Theory of Constraints (TOC), the bottleneck restricts the capacity of the entire operational chain; throughput cannot exceed the capacity of the bottleneck station.",
    keyConcept: "Theory of Constraints & Bottlenecks",
    formula: "System Capacity = Min(Capacity of Station 1, Station 2, ..., Station n)"
  },
  {
    id: "coms-rev-7",
    order: 7,
    question: "In project management, the Critical Path is the sequence of dependent activities that has zero slack time and determines shortest project duration.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Any delay in an activity on the Critical Path immediately delays completion of the entire project. Critical path activities have Total Float / Slack = 0.",
    keyConcept: "Critical Path Method (CPM)",
    formula: "Slack = Late Start (LS) - Early Start (ES) = 0"
  },
  {
    id: "coms-rev-8",
    order: 8,
    question: "What does Little's Law state in queuing and process analysis?",
    options: ["Work-in-Process = Throughput Rate × Flow Time (L = λ × W)", "Inventory = Cash divided by Fixed Costs", "Capacity = Workers times Overtime Hours", "Defects = Total Units squared"],
    correctAnswer: "Work-in-Process = Throughput Rate × Flow Time (L = λ × W)",
    explanation: "Little's Law is a fundamental operational theorem relating average inventory (L), arrival/throughput rate (λ), and average time spent in the system (W).",
    keyConcept: "Little's Law of Operations",
    formula: "L = λ × W | WIP = Throughput × Cycle Time"
  },
  {
    id: "coms-rev-9",
    order: 9,
    question: "Kaizen is a Japanese operational philosophy emphasizing:",
    options: ["Sudden, massive organizational restructuring", "Continuous, incremental improvements involving all employees from executive to shop floor", "Total reliance on external management consultants", "Replacing all human labor with robotic machinery"],
    correctAnswer: "Continuous, incremental improvements involving all employees from executive to shop floor",
    explanation: "Kaizen (kai = change, zen = good) champions everyday small, continuous improvements across all workflow facets with active participation of every employee.",
    keyConcept: "Kaizen Philosophy",
    formula: null
  },
  {
    id: "coms-rev-10",
    order: 10,
    question: "Which forecasting method assigns decreasing weights to historical observations as they become older?",
    options: ["Simple Moving Average", "Exponential Smoothing", "Linear Regression", "Delphi Method"],
    correctAnswer: "Exponential Smoothing",
    explanation: "Exponential smoothing calculates next period's forecast using the previous forecast adjusted by a smoothing constant (α) multiplied by the forecast error.",
    keyConcept: "Demand Forecasting Models",
    formula: "F_(t+1) = F_t + α × (A_t - F_t)"
  },
  {
    id: "coms-rev-11",
    order: 11,
    question: "Safety stock is held to buffer against:",
    options: ["Predictable and constant customer demand", "Uncertainties in demand fluctuations and supplier delivery lead times", "Lowering overall corporate tax payments", "Eliminating employee shift rotations"],
    correctAnswer: "Uncertainties in demand fluctuations and supplier delivery lead times",
    explanation: "Safety stock acts as an insurance reserve guarding against stockouts caused by demand surges or unexpected supplier logistics delays during lead time.",
    keyConcept: "Inventory Safety Stock",
    formula: "Reorder Point (ROP) = (Demand per day × Lead Time) + Safety Stock"
  },
  {
    id: "coms-rev-12",
    order: 12,
    question: "In quality management, a Pareto Chart is based on the principle that roughly 80% of problems result from 20% of causes.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "The 80/20 Pareto principle helps quality managers concentrate corrective efforts on the 'vital few' causes that generate the vast majority of operational defects.",
    keyConcept: "Pareto Analysis (80/20 Rule)",
    formula: null
  },
  {
    id: "coms-rev-13",
    order: 13,
    question: "What is an Ishikawa diagram also commonly called?",
    options: ["Gantt chart", "Fishbone or Cause-and-Effect diagram", "Control chart", "Scatter diagram"],
    correctAnswer: "Fishbone or Cause-and-Effect diagram",
    explanation: "Developed by Kaoru Ishikawa, fishbone diagrams visually organize potential root causes of an operational defect into standard categories (Machine, Method, Material, Manpower, Measurement, Environment).",
    keyConcept: "Root Cause Analysis (Fishbone)",
    formula: null
  },
  {
    id: "coms-rev-14",
    order: 14,
    question: "The bullwhip effect in supply chain management refers to:",
    options: ["The amplification of demand volatility as one moves upstream from customer to raw material supplier", "The physical damage incurred by shipments during trucking", "The gradual decline of factory machinery speed", "The price inflation of foreign currencies"],
    correctAnswer: "The amplification of demand volatility as one moves upstream from customer to raw material supplier",
    explanation: "Small fluctuations in retail consumer demand trigger increasingly exaggerated swings in wholesale orders, distributor orders, and factory manufacturing schedules.",
    keyConcept: "The Bullwhip Effect",
    formula: null
  },
  {
    id: "coms-rev-15",
    order: 15,
    question: "Which lean manufacturing tool uses visual cards or signals to authorize production or parts movement in a pull system?",
    options: ["Kanban", "Poka-Yoke", "Heijunka", "Gemba"],
    correctAnswer: "Kanban",
    explanation: "Kanban (visual sign/card) controls production flow by signaling upstream workstations to replenish only what downstream stations have consumed.",
    keyConcept: "Kanban Visual Pull System",
    formula: null
  },
  {
    id: "coms-rev-16",
    order: 16,
    question: "Poka-yoke is a Japanese operational concept focused on:",
    options: ["Mistake-proofing or fail-safing a process to prevent defects from occurring", "Cutting employee wages during slow periods", "Maximizing executive bonuses", "Eliminating safety inspections"],
    correctAnswer: "Mistake-proofing or fail-safing a process to prevent defects from occurring",
    explanation: "Poka-yoke designs mechanisms (like asymmetrical plugs or automated interlocks) that make it mechanically impossible for human workers to commit an error.",
    keyConcept: "Poka-Yoke (Mistake-Proofing)",
    formula: null
  },
  {
    id: "coms-rev-17",
    order: 17,
    question: "Overall Equipment Effectiveness (OEE) evaluates operational performance by combining:",
    options: ["Availability, Performance efficiency, and Quality rate", "Speed, Weight, and Cost", "Employee count, Overtime, and Bonus", "Sales revenue, Gross margin, and Overhead"],
    correctAnswer: "Availability, Performance efficiency, and Quality rate",
    explanation: "OEE is the gold standard metric for manufacturing productivity: OEE = Availability × Performance × Quality. A score of 85%+ is considered world-class.",
    keyConcept: "Overall Equipment Effectiveness (OEE)",
    formula: "OEE = Availability (%) × Performance (%) × Quality (%)"
  },
  {
    id: "coms-rev-18",
    order: 18,
    question: "What is cycle time in operations management?",
    options: ["The average time that elapses between the completion of two consecutive units", "The total calendar age of an employee", "The delivery schedule of raw materials", "The time required to file annual taxes"],
    correctAnswer: "The average time that elapses between the completion of two consecutive units",
    explanation: "Cycle time measures the production pace required or achieved at a workstation to output successive finished units.",
    keyConcept: "Cycle Time vs Takt Time",
    formula: "Takt Time = Available Operating Time / Customer Demand"
  },
  {
    id: "coms-rev-19",
    order: 19,
    question: "A Gantt chart is a graphical project management bar chart depicting activity schedules against a calendar timeline.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Developed by Henry Gantt, the chart illustrates start dates, durations, dependencies, and completion percentages of project milestones.",
    keyConcept: "Gantt Scheduling",
    formula: null
  },
  {
    id: "coms-rev-20",
    order: 20,
    question: "In inventory classification, ABC analysis categorizes stock items based on:",
    options: ["Alphabetical order of supplier names", "Annual consumption value (Pareto law)", "Package color and aesthetic design", "Physical warehouse weight only"],
    correctAnswer: "Annual consumption value (Pareto law)",
    explanation: "ABC Analysis ranks items: Category A represents the vital ~10-20% of items accounting for 70-80% of total annual consumption value, requiring tightest control.",
    keyConcept: "ABC Inventory Classification",
    formula: null
  },
  {
    id: "coms-rev-21",
    order: 21,
    question: "Capacity Utilization measures the percentage of design capacity actually being achieved by operations.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Capacity Utilization reflects operational efficiency and output headroom: Capacity Utilization = (Actual Output / Design Capacity) × 100%.",
    keyConcept: "Capacity Management",
    formula: "Capacity Utilization = (Actual Output / Maximum Design Capacity) × 100%"
  },
  {
    id: "coms-rev-22",
    order: 22,
    question: "Which of the following is considered one of the 8 Lean Wastes (Muda)?",
    options: ["Overproduction", "Motion waste", "Waiting time", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "The 8 Lean wastes (DOWNTIME): Defects, Overproduction, Waiting, Non-utilized talent, Transportation, Inventory, Motion, and Extra processing.",
    keyConcept: "The 8 Wastes of Lean (Muda)",
    formula: null
  },
  {
    id: "coms-rev-23",
    order: 23,
    question: "In statistical process control (SPC), what do Control Charts track?",
    options: ["Process stability and variations over time relative to upper and lower control limits", "Daily sales revenues of competitor firms", "Annual corporate income tax brackets", "Stock market ticker prices"],
    correctAnswer: "Process stability and variations over time relative to upper and lower control limits",
    explanation: "Control charts (Shewhart charts) plot sample metrics over time with Upper and Lower Control Limits (UCL/LCL) to distinguish common-cause from special-cause variation.",
    keyConcept: "Statistical Process Control (SPC)",
    formula: "UCL = Mean + 3σ | LCL = Mean - 3σ"
  },
  {
    id: "coms-rev-24",
    order: 24,
    question: "What is Cross-Docking in logistics operations?",
    options: ["Unloading goods directly from inbound trucks and loading them into outbound trucks with little to no storage in between", "Stacking pallets in an attic warehouse for 6 months", "Exporting goods across oceanic shipping canals", "Rejecting damaged supplier packages at the dock"],
    correctAnswer: "Unloading goods directly from inbound trucks and loading them into outbound trucks with little to no storage in between",
    explanation: "Cross-docking eliminates warehouse staging and put-away storage, transferring freight seamlessly from incoming to outbound transport within hours.",
    keyConcept: "Cross-Docking Logistics",
    formula: null
  },
  {
    id: "coms-rev-25",
    order: 25,
    question: "Vendor-Managed Inventory (VMI) is an arrangement where the supplier takes responsibility for maintaining agreed inventory levels at the customer's location.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Under VMI, the vendor receives demand data and proactively replenishes stock at the buyer's facility, lowering inventory risks and stockout frequencies.",
    keyConcept: "Vendor-Managed Inventory (VMI)",
    formula: null
  },
  {
    id: "coms-rev-26",
    order: 26,
    question: "What does the Reorder Point (ROP) formula determine?",
    options: ["The specific inventory level that signals a new purchase order must be placed", "The maximum discount a customer receives", "The annual employee turnover rate", "The price to charge for scrap metal"],
    correctAnswer: "The specific inventory level that signals a new purchase order must be placed",
    explanation: "The Reorder Point ensures a replenishment order arrives exactly before existing stock falls below safety stock buffers: ROP = (Lead Time Demand) + Safety Stock.",
    keyConcept: "Reorder Point (ROP)",
    formula: "ROP = (Daily Demand × Lead Time in Days) + Safety Stock"
  },
  {
    id: "coms-rev-27",
    order: 27,
    question: "Lead time is defined as the elapsed time from when an order is placed until the items are received and available for use.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Lead time includes order processing, manufacturing, transit shipping, customs clearance, and receiving inspection.",
    keyConcept: "Supply Chain Lead Time",
    formula: null
  },
  {
    id: "coms-rev-28",
    order: 28,
    question: "Total Quality Management (TQM) emphasizes that quality is the responsibility of:",
    options: ["Only the final quality control inspector at the end of the line", "Every person at every level of the organization", "Only the purchasing department manager", "Outside regulatory auditors exclusively"],
    correctAnswer: "Every person at every level of the organization",
    explanation: "TQM is an organization-wide management philosophy where continuous customer satisfaction and defect prevention are integrated into every employee's daily responsibilities.",
    keyConcept: "Total Quality Management (TQM)",
    formula: null
  },
  {
    id: "coms-rev-29",
    order: 29,
    question: "In operations, 'Gemba' refers to:",
    options: ["The real place where work is done and value is created (e.g. factory floor or frontline service desk)", "A high-ranking executive board meeting room", "An annual financial balance sheet report", "A legal arbitration court proceeding"],
    correctAnswer: "The real place where work is done and value is created (e.g. factory floor or frontline service desk)",
    explanation: "Lean practitioners conduct 'Gemba Walks' by visiting the actual shop floor where value is added to observe real processes, talk with workers, and uncover waste.",
    keyConcept: "Gemba Kaizen",
    formula: null
  },
  {
    id: "coms-rev-30",
    order: 30,
    question: "Mass customization combines the flexibility and personalization of custom-made products with the low unit costs of mass production.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Using modular product design and rapid flexible manufacturing, companies like Dell or Nike offer individualized customer configurations at mass-scale pricing.",
    keyConcept: "Mass Customization",
    formula: null
  }
]

export const courseReviewers: Record<string, CourseReviewer> = {
  CFMS: {
    programCode: "CFMS",
    programName: "Certificate in Financial Management Services (CFMS)",
    title: "CFMS Comprehensive Examination Reviewer & Question Guide",
    overview: "A targeted question-by-question study reviewer covering financial statement analysis, capital budgeting, working capital, cost of capital, and valuation frameworks tested in the CPACE CFMS examinations.",
    domains: [
      "Financial Statement Analysis & Ratio Interpretation",
      "Working Capital Management & Cash Conversion",
      "Time Value of Money & Capital Budgeting (NPV, IRR)",
      "Cost of Capital, WACC, and Capital Structure",
      "Cost-Volume-Profit (CVP) & Financial Forecasting"
    ],
    items: cfmsReviewerItems
  },
  CMMS: {
    programCode: "CMMS",
    programName: "Certificate in Marketing Management Services (CMMS)",
    title: "CMMS Comprehensive Examination Reviewer & Question Guide",
    overview: "A targeted question-by-question study reviewer covering the extended 7Ps marketing mix, STP frameworks, consumer behavior, digital funnels, and marketing performance metrics tested in the CPACE CMMS examinations.",
    domains: [
      "The 7Ps Extended Marketing Mix & Strategy",
      "Segmentation, Targeting, and Brand Positioning (STP)",
      "Consumer Buying Decision Journey & Psychology",
      "Digital Marketing Funnels, SEO, and Performance Media",
      "Customer Metrics (CAC, LTV, Churn, NPS, ROAS)"
    ],
    items: cmmsReviewerItems
  },
  COMS: {
    programCode: "COMS",
    programName: "Certificate in Operations Management Services (COMS)",
    title: "COMS Comprehensive Examination Reviewer & Question Guide",
    overview: "A targeted question-by-question study reviewer covering supply chain management, inventory models (EOQ, ROP), Six Sigma DMAIC, Lean 5S, and process capacity optimization tested in the CPACE COMS examinations.",
    domains: [
      "Operations Strategy & Bottleneck Theory of Constraints",
      "Inventory Optimization Models (EOQ, ROP, JIT, Safety Stock)",
      "Quality Management & Six Sigma Methodology (DMAIC)",
      "Lean Manufacturing Principles, 5S, and 8 Wastes (Muda)",
      "Project Management Scheduling (Critical Path Method, Gantt)"
    ],
    items: comsReviewerItems
  }
}

export function getReviewerByCourseCode(code: string): CourseReviewer {
  const upper = (code || "").toUpperCase()
  if (upper.includes("FINANC") || upper.includes("CFMS")) return courseReviewers.CFMS
  if (upper.includes("MARKET") || upper.includes("CMMS")) return courseReviewers.CMMS
  if (upper.includes("OPERAT") || upper.includes("COMS")) return courseReviewers.COMS
  return courseReviewers.CFMS
}

export function findReviewerItem(questionText: string): ReviewerItem | undefined {
  const cleanQ = (questionText || "").toLowerCase().trim()
  const allItems = [...cfmsReviewerItems, ...cmmsReviewerItems, ...comsReviewerItems]
  return allItems.find(item => {
    const itemQ = item.question.toLowerCase().trim()
    return itemQ === cleanQ || itemQ.includes(cleanQ) || cleanQ.includes(itemQ)
  })
}
