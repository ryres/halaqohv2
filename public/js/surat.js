(function(){
  // Minimal daftar surah (bisa diperluas jika diperlukan)
  const surahList = [
    'Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa','Al-Ma'idah','Al-An'am','Al-A'raf','Al-Anfal','At-Tawbah','Yunus',
    'Hud','Yusuf','Ar-Ra'd','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Taha',
    'Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan','Asy-Syu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum',
    'Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir',
    'Fussilat','Asy-Syura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf',
    'Adz-Dzariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi'ah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah',
    'As-Saff','Al-Jumuah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma'arij',
    'Nuh','Al-Jinn','Al-Muzzammil','Al-Muddathir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi'at','Abasa',
    'At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A'la','Al-Ghashiyah','Al-Fajr','Al-Balad',
    'Ash-Shams','Al-Lail','Ad-Dhuha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraisy','Al-Maun','Al-Kautsar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'
  ];

  function attachSuratDatalist() {
    const input = document.querySelector('input[name="surat"]');
    if (!input) return;

    let listId = input.getAttribute('list');
    if (!listId) {
      listId = 'suratList';
      input.setAttribute('list', listId);
    }

    if (document.getElementById(listId)) return;

    const dl = document.createElement('datalist');
    dl.id = listId;
    surahList.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      dl.appendChild(opt);
    });
    document.body.appendChild(dl);
  }

  document.addEventListener('DOMContentLoaded', attachSuratDatalist);
})();
