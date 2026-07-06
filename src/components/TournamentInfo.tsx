import React from "react";
import { Trophy, Clock, Target, Award, Users, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

export function TournamentInfo() {
  return (
    <div className="space-y-6">
      {/* Tournament Intro Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent rounded-2xl p-6 md:p-8 border border-purple-500/20 relative overflow-hidden">
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
          <Clock className="w-48 h-48 text-purple-400" />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> ТҮРХЭН ХУГАЦААНЫ ТЭМЦЭЭН
          </div>
          <h3 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
            Хэн хамгийн хурдан бэ? ⏱ 15 МИН
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Багшийн заавраар бүгд нэгэн зэрэг уралдаанд оролцож, бичих хурдаа сорих 15 минутын супер тэмцээн! Өөрийн авхаалж самбаа, хурууны хурдыг харуулж, ТОП 3-т багтан онцлох онооны эзэн болоорой.
          </p>
        </div>
      </div>

      {/* Rules and Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 font-bold">
            1
          </div>
          <h4 className="font-bold text-slate-200">Нэгдсэн холбоос</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Бүх сурагчид нэг тоглоом дээр зэрэг орно. Багш урилгын холбоос эсвэл өрөөний кодыг өгөх бөгөөд "Олон тоглогч" хэсэгт кодоо бичиж нэвтэрнэ.
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 font-bold">
            2
          </div>
          <h4 className="font-bold text-slate-200">Нэг л боломж</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Хүн бүрд 1 удаа уралдах боломж олгогдоно. Бичиж дуусмагц таны WPM болон нарийвчлалын оноо шууд Нэгдсэн Leaderboard-д бүртгэгдэнэ!
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 font-bold">
            3
          </div>
          <h4 className="font-bold text-slate-200">Супер Шагнал</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Шилдэг 🥇🥈🥉 ТОП 3-т орсон сурагчид хичээлийн нэмэлт ✨ ОНОО болон онцгой цол хүртэх болно. Амжилт хүсье!
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <HelpCircle className="w-4 h-4" /> ИЛҮҮ ИХ МЭДЭЭЛЭЛ
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="space-y-1.5">
            <h5 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              WPM гэж юу вэ?
            </h5>
            <p className="text-xs text-slate-400 pl-3">
              WPM (Words Per Minute) буюу "Минутад бичих үгийн тоо" нь таны бичих хурдыг хэмжих олон улсын стандарт нэгж юм. Сонгодог тооцооллоор 5 тэмдэгтийг 1 үг гэж үздэг.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Нарийвчлал яагаад чухал вэ?
            </h5>
            <p className="text-xs text-slate-400 pl-3">
              Буруу бичих тусам алдааг засварлах гэж хугацаа алддаг тул хурдаас гадна алдаагүй зөв бичих нь (Accuracy) хамгийн өндөр оноо авахад маш чухал нөлөөтэй.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
