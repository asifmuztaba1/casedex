/**
 * Per-page voice assistant scripts in English and Bengali.
 * Each key matches a pathname prefix. The assistant reads the
 * matching script when the user lands on that page.
 */

type Script = { en: string; bn: string };

const scripts: Record<string, Script> = {
  "/dashboard": {
    en: "Welcome to your dashboard! Here you can see an overview of your cases, upcoming hearings, deadlines, and recent documents. Use the sidebar on the left to navigate to different sections. You can create a new case by clicking the New Case button on the top right.",
    bn: "আপনার ড্যাশবোর্ডে স্বাগতম! এখানে আপনি আপনার মামলা, আসন্ন শুনানি, ডেডলাইন এবং সাম্প্রতিক নথিপত্রের সারসংক্ষেপ দেখতে পাবেন। বিভিন্ন বিভাগে যেতে বাম দিকের সাইডবার ব্যবহার করুন। উপরের ডানদিকে নতুন মামলা বাটনে ক্লিক করে নতুন মামলা তৈরি করতে পারবেন।",
  },
  "/cases/new": {
    en: "Let's create a new case. Fill in the case title, select the case type, and add the court information. You can also add the opposing party and your client details. Click Save when you're done.",
    bn: "চলুন একটি নতুন মামলা তৈরি করি। মামলার শিরোনাম, মামলার ধরন নির্বাচন করুন এবং আদালতের তথ্য যোগ করুন। আপনি বিপক্ষ এবং আপনার মক্কেলের বিবরণও যোগ করতে পারেন। সম্পন্ন হলে সেভ করুন।",
  },
  "/cases": {
    en: "This is your case list. You can see all your active cases here. Click on any case to view its details, hearings, documents, and diary entries. Use the search bar to find a specific case quickly.",
    bn: "এটি আপনার মামলার তালিকা। এখানে আপনার সকল সক্রিয় মামলা দেখতে পাবেন। যেকোনো মামলায় ক্লিক করে তার বিস্তারিত, শুনানি, নথি এবং ডায়েরি দেখতে পারবেন। দ্রুত কোনো মামলা খুঁজতে সার্চ বার ব্যবহার করুন।",
  },
  "/clients": {
    en: "Here you manage your clients. Add new clients, view their associated cases, and keep their contact information up to date. Each client can be linked to multiple cases.",
    bn: "এখানে আপনি আপনার মক্কেলদের পরিচালনা করতে পারবেন। নতুন মক্কেল যোগ করুন, তাদের সংশ্লিষ্ট মামলা দেখুন এবং যোগাযোগের তথ্য আপডেট রাখুন। প্রতিটি মক্কেল একাধিক মামলার সাথে যুক্ত হতে পারে।",
  },
  "/contacts": {
    en: "Your contacts directory. Store details of judges, opposing counsels, court staff, and other legal contacts you interact with regularly.",
    bn: "আপনার পরিচিতি ডিরেক্টরি। বিচারক, বিপক্ষ আইনজীবী, আদালত কর্মচারী এবং অন্যান্য আইনি পরিচিতিদের তথ্য সংরক্ষণ করুন।",
  },
  "/hearings": {
    en: "This is your hearings page. View all scheduled hearings across your cases. You can filter by date, add new hearings, and record outcomes after each hearing.",
    bn: "এটি আপনার শুনানির পৃষ্ঠা। আপনার সকল মামলার নির্ধারিত শুনানি দেখুন। তারিখ অনুযায়ী ফিল্টার করুন, নতুন শুনানি যোগ করুন এবং প্রতিটি শুনানির পরে ফলাফল রেকর্ড করুন।",
  },
  "/daily-register": {
    en: "This is the Seresta, your daily cause list register. It shows all hearings for a specific date in the traditional register format. You can edit outcomes inline, navigate between dates, and print it for court use.",
    bn: "এটি সেরেস্তা, আপনার দৈনিক কজ লিস্ট রেজিস্টার। এখানে একটি নির্দিষ্ট তারিখের সকল শুনানি ঐতিহ্যবাহী রেজিস্টার ফরম্যাটে দেখা যায়। আপনি সরাসরি ফলাফল সম্পাদনা করতে, তারিখ পরিবর্তন করতে এবং আদালতের জন্য প্রিন্ট করতে পারবেন।",
  },
  "/calendar": {
    en: "Your calendar view. See hearings, deadlines, and diary entries on a monthly calendar. Click on any date to see details or add new events.",
    bn: "আপনার ক্যালেন্ডার ভিউ। মাসিক ক্যালেন্ডারে শুনানি, ডেডলাইন এবং ডায়েরি এন্ট্রি দেখুন। বিস্তারিত দেখতে বা নতুন ইভেন্ট যোগ করতে যেকোনো তারিখে ক্লিক করুন।",
  },
  "/documents": {
    en: "Your document management section. Upload, organize, and search through all case-related documents. Supported formats include PDF, images, and Word documents.",
    bn: "আপনার নথি ব্যবস্থাপনা বিভাগ। মামলা-সংক্রান্ত সকল নথি আপলোড, সাজান এবং অনুসন্ধান করুন। পিডিএফ, ছবি এবং ওয়ার্ড ডকুমেন্ট সমর্থিত।",
  },
  "/library": {
    en: "The legal library. Access reference materials, legal templates, and saved research. You can organize resources by category for quick access.",
    bn: "আইনি গ্রন্থাগার। রেফারেন্স উপকরণ, আইনি টেমপ্লেট এবং সংরক্ষিত গবেষণা অ্যাক্সেস করুন। দ্রুত অ্যাক্সেসের জন্য ক্যাটাগরি অনুযায়ী রিসোর্স সাজাতে পারবেন।",
  },
  "/ai": {
    en: "CaseDex AI Assistant. Ask legal research questions, get case summaries, or draft documents using AI. Your data stays private and secure.",
    bn: "CaseDex AI সহকারী। আইনি গবেষণা প্রশ্ন করুন, মামলার সারসংক্ষেপ পান বা AI ব্যবহার করে নথি খসড়া করুন। আপনার ডেটা ব্যক্তিগত এবং সুরক্ষিত থাকবে।",
  },
  "/notifications": {
    en: "Your notifications. Stay updated on hearing reminders, document uploads, and important case updates. You can mark notifications as read or click them to go directly to the related item.",
    bn: "আপনার বিজ্ঞপ্তি। শুনানির রিমাইন্ডার, নথি আপলোড এবং গুরুত্বপূর্ণ মামলার আপডেট সম্পর্কে অবগত থাকুন। বিজ্ঞপ্তি পঠিত হিসেবে চিহ্নিত করুন বা সংশ্লিষ্ট আইটেমে সরাসরি যেতে ক্লিক করুন।",
  },
  "/support": {
    en: "Need help? Submit a support ticket and our team will get back to you. You can also start the product tour from here to learn about all features.",
    bn: "সাহায্য দরকার? একটি সাপোর্ট টিকেট জমা দিন এবং আমাদের টিম আপনার সাথে যোগাযোগ করবে। সকল ফিচার সম্পর্কে জানতে এখান থেকে প্রোডাক্ট ট্যুরও শুরু করতে পারবেন।",
  },
  "/settings": {
    en: "Settings page. Update your profile, manage your team members, and configure your workspace preferences.",
    bn: "সেটিংস পৃষ্ঠা। আপনার প্রোফাইল আপডেট করুন, টিম সদস্য পরিচালনা করুন এবং আপনার ওয়ার্কস্পেস পছন্দ কনফিগার করুন।",
  },
  "/settings/billing": {
    en: "Billing and subscription management. View your current plan, upgrade or manage your subscription, and check payment history.",
    bn: "বিলিং এবং সাবস্ক্রিপশন ব্যবস্থাপনা। আপনার বর্তমান প্ল্যান দেখুন, আপগ্রেড বা সাবস্ক্রিপশন পরিচালনা করুন এবং পেমেন্ট ইতিহাস দেখুন।",
  },
};

/**
 * Returns the best matching script for the given pathname.
 * Tries exact match first, then prefix match (longest wins).
 */
export function getAssistantScript(pathname: string): Script | null {
  // Exact match
  if (scripts[pathname]) return scripts[pathname];

  // Prefix match — longest prefix wins
  let best: Script | null = null;
  let bestLen = 0;
  for (const key of Object.keys(scripts)) {
    if (pathname.startsWith(key) && key.length > bestLen) {
      best = scripts[key];
      bestLen = key.length;
    }
  }
  return best;
}
