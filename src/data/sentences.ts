export interface Sentence {
  text: string;
  language: "mongolian" | "english";
  author?: string;
  difficulty: "easy" | "medium" | "hard";
}

export const SENTENCES: Sentence[] = [
  // Mongolian Sentences - Easy (1 sentence)
  {
    text: "Ажил хийвэл ам тосодно гэж монголчууд ярьдаг бөгөөд хөдөлмөрлөсөн хүн бүрийн зүтгэл хэзээ нэгэн цагт заавал үр шимээ өгдөг билээ.",
    language: "mongolian",
    author: "Монгол ардын зүйр үг",
    difficulty: "easy"
  },
  {
    text: "Технологийн хурдацтай хөгжил нь хүн төрөлхтний амьдрах хэв маягийг бүрэн өөрчилж, шинэ боломжуудыг нээж байна.",
    language: "mongolian",
    difficulty: "easy"
  },
  {
    text: "Эв нэгдэлтэй байвал ямар ч хүндрэл бэрхшээлийг хамтдаа даван туулж, илүү гэрэл гэгээтэй ирээдүйг цогцлоох боломжтой.",
    language: "mongolian",
    difficulty: "easy"
  },
  {
    text: "Бидний амьдралын хамгийн том ялалт бол хэзээ ч унахгүй байхдаа биш, харин унах бүртээ босож чаддагт оршдог юм шүү.",
    language: "mongolian",
    author: "Нельсон Мандела",
    difficulty: "easy"
  },
  {
    text: "Зорилгогүй амьдрал бол чиг заагчгүй усан онгоцтой адил бөгөөд салхины аясаар хаашаа ч хамаагүй урсан одох аюултай байдаг.",
    language: "mongolian",
    difficulty: "easy"
  },

  // Mongolian Sentences - Medium (2 sentences)
  {
    text: "Өнөөдөр хийж чадах зүйлийг маргааш гэж бүү хойшлуул. Хугацаа алдах тусам ажил хуримтлагдаж, амжилтаас улам бүр хоцорно.",
    language: "mongolian",
    author: "Бенжамин Франклин",
    difficulty: "medium"
  },
  {
    text: "Мэдлэг бол хүч чадал мөн. Ном унших нь ухааныг тэлж, ертөнцийг харах цонхыг нээж, амьдралын зөв замыг сонгоход тусалдаг.",
    language: "mongolian",
    author: "Фрэнсис Бэкон",
    difficulty: "medium"
  },
  {
    text: "Сурсан далай, сураагүй балай. Хүн насан туршдаа тасралтгүй суралцаж, өөрийгөө хөгжүүлж байж л цаг үетэйгээ хөл нийлүүлнэ.",
    language: "mongolian",
    author: "Монгол ардын зүйр үг",
    difficulty: "medium"
  },
  {
    text: "Залуу нас бол сурч боловсрох, өөрийгөө нээх хамгийн алтан үе юм. Энэ цагийг үр ашиггүй өнгөрөөх нь ирээдүйн олон боломжийг хаах аюултай.",
    language: "mongolian",
    difficulty: "medium"
  },

  // Mongolian Sentences - Hard (4 sentences)
  {
    text: "Хүн бүрт өөрийн гэсэн авьяас чадвар, давуу тал заавал байдаг. Үүнийгээ олж нээж, тууштай хөгжүүлэх нь амжилтад хүрэх гол түлхүүр билээ. Хэцүү бэрхшээлтэй тулгарах бүрт шантралгүй, урагш тэмүүлэх зоригтой байх хэрэгтэй. Чиний өнөөдөр хийж буй жижигхэн зүтгэл ч маргаашийн агуу амжилтын эхлэл болно.",
    language: "mongolian",
    difficulty: "hard"
  },
  {
    text: "Монгол нутаг бол уудам дэлгэр тал нутаг, өндөр сүрлэг уулс, говь хангай хосолсон байгалийн үзэсгэлэнт газар билээ. Нүүдэлчин ахуй соёл нь байгаль дэлхийтэйгээ зохицон амьдрах ухааныг бидэнд өвлүүлэн үлдээсэн юм. Өвөг дээдсийнхээ энэхүү нандин өв уламжлалыг хайрлан хамгаалж, хойч үедээ өвлүүлэх нь бидний ариун үүрэг мөн. Орчин үеийн хөгжилтэй хөл нийлүүлэн алхахын зэрэгцээ үндэсний соёлоо хадгалах нь чухал ач холбогдолтой.",
    language: "mongolian",
    difficulty: "hard"
  },

  // English Sentences - Easy (1 sentence)
  {
    text: "The quick brown fox jumps over the lazy dog in a spectacular display of agility and speed.",
    language: "english",
    difficulty: "easy"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts in the long run.",
    language: "english",
    author: "Winston Churchill",
    difficulty: "easy"
  },
  {
    text: "Coding is not just about writing syntax; it is about solving complex problems and creating innovative tools for humanity.",
    language: "english",
    difficulty: "easy"
  },
  {
    text: "Innovation distinguishes between a leader and a follower in the fast-paced world of modern technology.",
    language: "english",
    author: "Steve Jobs",
    difficulty: "easy"
  },

  // English Sentences - Medium (2 sentences)
  {
    text: "Be the change that you wish to see in the world. Every small positive action contributes to a larger transformation.",
    language: "english",
    author: "Mahatma Gandhi",
    difficulty: "medium"
  },
  {
    text: "Strive not to be a success, but rather to be of value. When you focus on adding value, success naturally follows.",
    language: "english",
    author: "Albert Einstein",
    difficulty: "medium"
  },
  {
    text: "Believe you can and you are halfway there. The mind is a powerful instrument that guides our actions and destiny.",
    language: "english",
    author: "Theodore Roosevelt",
    difficulty: "medium"
  },
  {
    text: "Your time is limited, so do not waste it living someone else's life. Have the courage to follow your heart and intuition.",
    language: "english",
    author: "Steve Jobs",
    difficulty: "medium"
  },

  // English Sentences - Hard (4 sentences)
  {
    text: "The journey of a thousand miles begins with a single step. Every great achievement starts with the decision to try. Do not let the fear of making mistakes hold you back from your potential. The only limit to our realization of tomorrow is our doubts of today.",
    language: "english",
    author: "Lao Tzu & Franklin D. Roosevelt",
    difficulty: "hard"
  },
  {
    text: "Learning to code opens up a whole new world of logical thinking and creativity. It enables you to bring your wild ideas to life through software. Although the learning process can sometimes be challenging and frustrating, perseverance is always rewarded. Every developer started where you are now, so keep typing and building.",
    language: "english",
    difficulty: "hard"
  }
];

export function getRandomSentence(
  language?: "mongolian" | "english" | "any",
  difficulty?: "easy" | "medium" | "hard"
): Sentence {
  let list = SENTENCES;
  if (language && language !== "any") {
    list = SENTENCES.filter(s => s.language === language);
  }
  if (difficulty) {
    const filteredByDifficulty = list.filter(s => s.difficulty === difficulty);
    if (filteredByDifficulty.length > 0) {
      list = filteredByDifficulty;
    }
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}
