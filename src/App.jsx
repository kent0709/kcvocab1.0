import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, RefreshCcw, Brain, Zap, Star, Flame, Share2, Check, Loader2, AlertTriangle, ChevronRight, Clock, Home, Trophy, Lock, Trash2, Shuffle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

// --- 1. Firebase 資料庫專用配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyD2dxrjW68kjR66RgeFdXl2o4jW2ooGwwU",
  authDomain: "killercards.firebaseapp.com",
  projectId: "killercards",
  storageBucket: "killercards.firebasestorage.app",
  messagingSenderId: "281065379733",
  appId: "1:281065379733:web:06fc2160b85fae7579c89c",
  measurementId: "G-PVFYPMRPH2"
};

// --- 2. 金鑰自動讀取 ---
const getEnvKey = () => {
  try {
    const env = typeof import.meta !== 'undefined' ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    const k = env?.VITE_GEMINI_API_KEY;
    if (k && (k === firebaseConfig.apiKey || k === "AIzaSyBTcPWX29sXFY0dqzOpJn8We6uoJLwHv9U")) return ""; 
    return k;
  } catch(e) {}
  return "";
};

const getLocalKey = () => {
  try { return localStorage.getItem('my_gemini_key') || ""; } catch(e) { return ""; }
};

const isCanvas = typeof __firebase_config !== 'undefined';
const app = initializeApp(isCanvas ? JSON.parse(__firebase_config) : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : (firebaseConfig.projectId !== '請在此填入新的_projectId' ? firebaseConfig.projectId : 'kcvocabapp');

const safePushState = (url) => {
  try {
    const hostname = window.location.hostname;
    if (
      window.location.protocol === 'blob:' || 
      window.origin === 'null' || 
      hostname.includes('webcontainer') || 
      hostname.includes('stackblitz') ||
      hostname.includes('usercontent')
    ) return;
    window.history.pushState({}, '', url);
  } catch (e) {}
};

// --- 💡 幼兒園基礎單字庫 ---
const kinderRawData = `zero,零|one,一|two,二|three,三|four,四|five,五|six,六|seven,七|eight,八|nine,九|ten,十|eleven,十一|twelve,十二|thirteen,十三|fourteen,十四|fifteen,十五|sixteen,十六|seventeen,十七|eighteen,十八|nineteen,十九|twenty,二十|thirty,三十|forty,四十|fifty,五十|sixty,六十|seventy,七十|eighty,八十|ninety,九十|hundred,百|I,我|You,你（你們）|We,我們|They,他們|He,他（男）|She,她（女）|It,它（牠）|my,我的|your,你的（你們的）|his,他的（男）|her,她的（女）|its,它的、牠的|grandmother,阿嬤|grandfather,阿公|mother,媽媽|father,爸爸|sister,姊妹|brother,兄弟|baby,嬰兒|girl,女孩|boy,男孩|woman,女人|man,男人|cook,廚師|teacher,老師|student,學生|farmer,農夫|doctor,醫生|nurse,護理師|driver,司機|head,頭|hair,頭髮|eye,眼睛|nose,鼻子|mouth,嘴巴|ear,耳朵|hand,手|leg,腿|foot,腳|hat,帽子|glasses,眼鏡|shirt,襯衫|shorts,短褲|pants,長褲|skirt,裙子|dress,洋裝|socks,襪子|shoes,鞋子|boots,靴子|bear,熊|dog,狗|cat,貓|bird,鳥|rabbit,兔|frog,青蛙|fish,魚|chicken,雞|turtle,烏龜|lion,獅子|tiger,虎|monkey,猴子|giraffe,長頸鹿|fox,狐狸|zebra,斑馬|pig,豬|elephant,大象|pen,原子筆|pencil,鉛筆|marker,麥克筆|eraser,橡皮擦|ruler,尺|book,書|bag,袋子|desk,書桌|table,餐桌|chair,椅子|crayon,蠟筆|box,箱子|door,門|window,窗戶|picture,圖片|TV,電視|sofa,沙發|light,光|bed,床|lamp,燈|clock,時鐘|cellphone,手機|videogame,電動|computer,電腦|cup,杯子|mug,馬克杯|bowl,碗|ball,球|yoyo,溜溜球|bat,球棒|robot,機器人|kite,風箏|doll,娃娃|mop,拖把|map,地圖|weather,天氣|sun,太陽|cloud,雲|wind,風|rain,雨|snow,雪|river,河|flower,花|grass,草|tree,樹|bike,腳踏車|car,車|bus,公車|train,火車|taxi,計程車|breakfast,早餐|lunch,午餐|dinner,晚餐|cookie,餅乾|icecream,冰淇淋|candy,糖果|hamburger,漢堡|hotdog,熱狗|pizza,比薩|bread,麵包|sandwich,三明治|cake,蛋糕|rice,飯|noodles,麵|spaghetti,義大利麵|tea,茶|coke,可樂|soda,汽水|water,水|juice,果汁|milk,牛奶|egg,蛋|ham,火腿|salad,沙拉|tomato,番茄|banana,香蕉|apple,蘋果|pear,梨子|grape,葡萄|peach,桃子|home,家|school,學校|park,公園|zoo,動物園|store,商店|shop,商店|house,房子|garage,車庫|livingroom,客廳|diningroom,飯廳|kitchen,廚房|bedroom,臥室|bathroom,浴室、廁所|yard,庭院|garden,花園、菜園|o'clock,點鐘|now,現在|morning,早上|afternoon,下午|evening,傍晚|night,晚上|today,今天|Sunday,星期天|Monday,星期一|Tuesday,星期二|Wednesday,星期三|Thursday,星期四|Friday,星期五|Saturday,星期六|do,做|like,喜歡|love,愛|want,想要|have,擁有|run,跑|walk,走路|swim,游泳|jump,跳|ride,騎|dance,跳舞|sing,唱|write,寫|read,閱讀|draw,畫|color,上色|paint,畫|speak,說|say,說|eat,吃|drink,喝|look,看|watch,看|see,看|listen,聽|smile,微笑|laugh,大笑|cry,哭|hold,拿|put,放|take,拿|sit,坐|stand,站|fine,好的|good,好的|bad,壞的|favorite,最喜歡的|big,大的|small,小的|little,小的|old,老的、舊的|young,年輕的|tall,高的|long,長的|short,短的|thin,瘦的、薄的|fat,胖的|fast,快的|slow,慢的|clean,乾淨的|dirty,髒的|hungry,餓的|thirsty,渴的|happy,開心的|unhappy,不開心的|sad,傷心的|angry,生氣的|sick,生病的|tired,累的|hot,熱的|cold,冷的|rainy,下雨的|snowy,下雪的|sunny,晴朗的|cloudy,多雲的|windy,起風的|black,黑色的|white,白色的|gray,灰色的|brown,咖啡色的|red,紅色的|orange,橘色的|yellow,黃色的|green,綠色的|blue,藍色的|purple,紫色的|pink,粉紅色的|at,在…地點|in,在…裡面|on,在…上面|under,在…下面|by,在…旁邊|nextto,在…旁邊|beside,在…旁邊|infrontof,在…前面|behind,在…後面|who,誰|what,什麼|when,何時|where,哪裡|which,哪一個|why,為什麼|whattime,幾點|how,如何|howmuch,多少|howmany,多少`;
const kinderVocab = kinderRawData.split('|').map(item => {
  const [word, meaning] = item.split(',');
  return { word, meaning: meaning || word };
});

const kinderCategories = [
  { name: "小班", icon: "🍼", start: 0, end: 100, type: 'kinder' },
  { name: "中班", icon: "🧸", start: 100, end: 200, type: 'kinder' },
  { name: "大班", icon: "🖍️", start: 200, end: 300, type: 'kinder' }
];

// --- 💡 全新國小字庫 ---
const primaryDataRaw = {
  "一上": "act ; around ; ball ; basket ; between ; book ; brave ; but ; camp ; chicken ; clock ; copy ; cross ; deep ; door ; drum ; enemy ; eye ; farm ; final ; form ; free ; giant ; grape ; hall ; heart ; him ; history ; hungry ; idea ; join ; kick ; lake ; left ; listen ; luck ; magic ; meat ; mom ; monkey ; mud ; neck ; never ; nobody ; noon ; officer ; over ; paint ; perfect ; planet",
  "一中": "about ; apple ; bag ; beach ; blue ; born ; bread ; butterfly ; candy ; choice ; close ; corn ; crow ; deer ; dot ; dry ; energy ; face ; fat ; find ; forty ; Friday ; gift ; grass ; hallway ; heat ; himself ; hit ; hunt ; if ; joke ; kid ; lamb ; leg ; little ; lucky ; magnet ; medicine ; moment ; month ; museum ; need ; new ; noise ; north ; often ; owl ; pair ; period ; plant",
  "一下": "above ; are ; banana ; bean ; board ; both ; break ; buy ; cap ; choose ; clothes ; corner ; crowd ; desk ; double ; duck ; enjoy ; fact ; father ; fine ; forward ; friend ; giraffe ; gray ; ham ; heavy ; hip ; hobby ; hurry ; ill ; joy ; kill ; lamp ; lemon ; live ; lunch ; mail ; meet ; Monday ; moon ; music ; needle ; news ; noisy ; nose ; oh ; own ; pajamas ; person ; plate",
  "二上": "across ; arm ; bank ; bear ; boat ; bottom ; breakfast ; by ; car ; chores ; cloud ; cost ; cry ; detective ; down ; dump ; enough ; factory ; favorite ; finger ; found ; frog ; girl ; great ; hammer ; helicopter ; his ; hold ; hurt ; important ; juice ; kind ; land ; lend ; lizard ; machine ; mailbox ; meeting ; money ; more ; must ; neighbor ; newspaper ; none ; not ; oil ; pack ; palace ; pet ; play",
  "二中": "add ; arrive ; base ; beautiful ; body ; box ; bridge ; cake ; card ; church ; clown ; couch ; cup ; did ; draw ; during ; enter ; fall ; fear ; finish ; four ; front ; give ; green ; hand ; hello ; hole ; holiday ; husband ; in ; July ; king ; large ; length ; lock ; mad ; main ; melody ; morning ; mother ; my ; neighborhood ; next ; notebook ; nothing ; old ; package ; pan ; phone ; playground",
  "二下": "after ; art ; bath ; because ; bone ; boy ; bright ; calendar ; care ; circle ; club ; count ; cupboard ; die ; dream ; dust ; environment ; family ; feed ; fire ; fourteen ; fruit ; glad ; grew ; happen ; help ; home ; honest ; ice ; inch ; jump ; kiss ; last ; less ; locker ; make ; man ; melt ; most ; mountain ; myself ; nervous ; nice ; notice ; now ; on ; page ; panda ; piano ; please",
  "三上": "chalk ; lazy ; ground ; interest ; map ; dark ; fell ; of ; a ; baby ; early ; hat ; instead ; knife ; number ; paper ; cereal ; dance ; felt ; grow ; jaw ; knee ; law ; nut ; parent ; alone ; bad ; danger ; east ; fur ; hard ; jar ; lay ; March ; ocean ; age ; back ; chair ; earth ; funny ; inside ; knew ; mark ; October ; fast ; fun ; group ; has ; January ; nurse",
  "三中": "jeans ; learn ; once ; guard ; part ; date ; easy ; knock ; against ; backpack ; change ; few ; head ; iron ; lead ; off ; race ; ago ; bathtub ; chart ; daughter ; edge ; field ; have ; jelly ; knot ; market ; office ; radio ; again ; be ; cherry ; dash ; eat ; fence ; future ; he ; into ; jet ; leaf ; marry ; park ; party ; name ; mask ; invite ; furniture ; nap ; nail ; knight",
  "三下": "island ; game ; eighteen ; bed ; chest ; dear ; fifty ; guitar ; just ; least ; matter ; one ; past ; agree ; child ; day ; egg ; fight ; garage ; hook ; is ; kangaroo ; leave ; May ; onion ; pass ; all ; become ; children ; dead ; eight ; fifteen ; garden ; hop ; it ; know ; led ; narrow ; only ; path ; air ; bedroom ; guest ; guide ; hope ; junk ; knowledge ; match ; nature ; near",
  "四上": "pie ; safe ; decide ; elephant ; half ; question ; quiet ; rain ; chips ; gave ; fire ; raise ; sail ; eighty ; general ; said ; gas ; fish ; chocolate ; safety ; ran ; piece ; picnic ; dinner ; hair ; hear ; diet ; pick ; either ; happy ; quick ; queen ; five ; else ; chin ; cheese ; rabbit ; quit ; sad ; heard ; different ; city ; fill ; eleven ; gentle ; dig ; fireplace ; picture ; rainbow ; clean",
  "四中": "empty ; read ; dish ; hero ; dirt ; climb ; quite ; evening ; classroom ; get ; her ; color ; flashlight ; reason ; glass ; pin ; flat ; every ; salad ; distance ; ready ; real ; flag ; sand ; clear ; doctor ; floor ; helpful ; end ; do ; clap ; salt ; everyone ; hers ; flash ; reach ; same ; pilot ; glove ; pillow ; go ; pig ; flower ; glasses ; here ; dinosaur ; pine ; class ; ever ; glue",
  "四下": "everywhere ; foot ; high ; relax ; donkey ; pink ; everything ; red ; coffee ; goose ; repair ; good ; hide ; football ; plate ; pipe ; remember ; gone ; comb ; hill ; forget ; for ; follow ; done ; dollar ; cold ; computer ; food ; coin ; forest ; honey ; doll ; plan ; goat ; dog ; place ; pizza ; plane ; fly ; homework ; golden ; plant ; coat ; come ; goodbye ; dolphin ; gold ; repeat ; remove ; recess",
  "五上": "almost ; bell ; call ; poison ; report ; many ; also ; belong ; came ; police ; rest ; maybe ; always ; below ; camera ; polite ; restaurant ; me ; am ; belt ; can ; pond ; return ; meal ; an ; bench ; candle ; pool ; rice ; mean ; and ; beside ; catch ; poor ; rich ; measure ; animal ; best ; cause ; popcorn ; ride ; member ; another ; better ; cave ; popular ; right ; memory ; answer ; big",
  "五中": "any ; bike ; celebrate ; positive ; ring ; men ; anyone ; bird ; center ; post ; river ; message ; anything ; birthday ; check ; pot ; road ; metal ; area ; bit ; country ; potato ; robot ; method ; as ; black ; course ; pound ; rock ; middle ; ask ; blanket ; cousin ; pour ; rocket ; might ; at ; blind ; cover ; power ; roller ; mile ; aunt ; block ; cow ; practice ; roof ; milk ; autumn ; blood",
  "五下": "away ; boot ; crayon ; pray ; room ; mind ; dress ; brush ; create ; present ; root ; mine ; drop ; build ; pretty ; rope ; minute ; dry ; building ; price ; rose ; mirror ; early ; burn ; prince ; rough ; miss ; earth ; bus ; princess ; round ; mistake ; east ; busy ; principal ; row ; mitt ; edge ; butter ; print ; rub ; mix ; egg ; president ; prize ; rubber ; model ; press ; problem ; modern",
  "六上": "rude ; brother ; careful ; loud ; mad ; rug ; brown ; carrot ; love ; magic ; rule ; brush ; carry ; low ; magnet ; ruler ; cookie ; case ; luck ; mail ; run ; cool ; cat ; lucky ; mailbox ; proud ; machine ; lunch ; main ; pull ; March ; make ; mark ; pumpkin ; man ; market ; puppy ; many ; marry ; purple ; map ; mask ; push ; matter ; match ; put ; May ; puzzle ; maybe ; me",
  "六中": "meal ; middle ; moment ; mouse ; mean ; might ; Monday ; mouth ; measure ; mile ; money ; move ; meat ; milk ; monkey ; movie ; medicine ; mind ; month ; much ; meet ; mine ; moon ; mud ; meeting ; minute ; more ; museum ; melody ; mirror ; morning ; music ; melt ; miss ; most ; must ; member ; mistake ; mother ; mountain ; memory ; mitt ; mix ; men ; model ; message ; modern ; metal ; mom ; method",
  "六下": "my ; neat ; news ; none ; nothing ; myself ; neck ; newspaper ; noon ; notice ; nail ; need ; next ; north ; now ; name ; needle ; nice ; nose ; number ; nap ; neighbor ; night ; not ; nurse ; napkin ; neighborhood ; nine ; notebook ; nut ; narrow ; nervous ; nineteen ; ocean ; nature ; nest ; ninety ; October ; near ; net ; no ; of ; never ; nobody ; off ; new ; noise ; office ; noisy ; officer"
};

// --- 💡 全新國中與進階字庫 ---
const juniorDataRaw = {
  "國一上1": "accept、basic、calm、daily、earn、failure、gather、haircut、ill、jam、koala、lady、mad、nail、obey、pain、quality、race、safety、tail、ugly、valley、waist、yard、zebra、accident、basis、campus、dawn、edge、fair、gentle、handle、imagine、jar、kitten、leaf、main、narrow、ocean、painter、quarter、railroad、sail、task、unit、value、wallet、youth、zero",
  "國一上2": "achieve、bean、cancel、deaf、effect、fancy、ghost、hang、inch、jazz、lack、length、major、nation、offer、panda、quickly、raincoat、sample、tear、universe、verb、war、yucky、absent、beard、cancer、deal、effort、far、gloves、hardly、include、jealous、lamb、level、male、nature、official、pardon、quit、raise、sand、temple、university、vest、waste、yummy、abroad、beat",
  "國一上3": "ability、beer、candle、death、either、faucet、glue、heater、income、jeep、lane、lid、mall、nearly、omit、parrot、quiz、rapid、satisfied、tent、upon、victory、waterfall、action、behave、captain、debate、elder、fault、goal、height、increase、jogging、lantern、lift、manager、necessary、onion、partner、rare、satisfy、term、upstairs、village、watermelon、active、belief、career、debt、elect",
  "國一下1": "actor、bench、careless、decision、electric、favor、god、helicopter、industry、joke、law、lightning、manner、negative、operate、passenger、rat、saucer、terrible、used、vinegar、wave、address、backward、carpet、decorate、element、fear、gold、hen、influence、journalist、lawyer、limit、marker、neighbor、operation、paste、rather、scared、terrific、usual、violin、wedding、admire、badminton、carrot、deep、emotion、feather",
  "國一下2": "adult、base、cabbage、damage、eagle、fail、gain、hall、impolite、jar、kangaroo、law、magazine、napkin、occupation、painful、quarter、receive、salesman、talkative、underlie、valuable、waste、willing、addition、basement、cabinet、dancing、earrings、fair、garage、hammer、importance、jazz、ketchup、lawyer、magician、narrow、occur、pale、quickly、recent、sample、tangerine、underpass、verb、waterfall、wolf、advance、bat",
  "國一下3": "advantage、beginner、cable、danger、eastern、fancy、gate、handkerchief、impossible、jealous、kilometer、lay、male、nationality、offer、pan、quit、record、sand、tank、underwear、vest、wave、wonder、adverb、beginning、cafeteria、data、edge、fantastic、gather、handle、improve、jeep、kindergarten、leaf、manager、natural、official、papaya、quiz、recover、satisfied、task、unfriendly、victory、wedding、wood、advice、behave",
  "國二上1": "advise、being、cage、dawn、education、fashionable、general、hang、inch、jogging、kingdom、length、mango、nature、omit、pardon、race、recycle、satisfy、teapot、unique、village、weekday、affair、belief、calendar、deaf、effect、fault、generally、hanger、include、joke、kitty、lettuce、manner、naughty、oneself、parrot、railroad、refuse、saucer、tear、universe、vinegar、weight、affect、bench、calm、wooden",
  "國二上2": "against、besides、camping、deal、effective、favor、generation、hardly、income、journalist、koala、level、marker、nearly、onion、particular、raincoat、regard、scared、temperature、university、violin、western、ahead、best、campus、death、effort、fear、generous、heater、increase、judge、lack、lid、marriage、necessary、operate、partner、raise、regret、scarf、tent、upon、visitor、whale、aid、better、cancel、debate",
  "國二上3": "ahead、bomb、century、design、electricity、flight、golf、hunter、invent、ketchup、lift、minor、needle、oven、pipe、quiz、rope、spider、thief、underwear、voter、wood、airmail、bone、cereal、dessert、element、flour、goodness、humid、invitation、kilometer、lightning、minus、nephew、overpass、plain、race、rub、spirit、thirteenth、unfriendly、waist、wooden、alarm、bookcase、certain、detect、eleventh、flow",
  "國二下1": "goose、humor、invite、kindergarten、limit、mirror、nervous、overseas、plant、railroad、rubber、sport、thirtieth、unique、wallet、woods、alike、bother、certainly、determine、emotion、flu、government、humorous、iron、kingdom、link、missing、nest、owner、plastic、raincoat、rude、spread、thought、unit、war、worried、alive、bow、chairman、determiner、emphasize、flute、grand、hunger、jam、kitten、liquid、mix",
  "國二下2": "newspaper、ox、plate、raise、running、stage、throat、universe、waste、worth、alley、bowling、channel、develop、employ、focus、granddaughter、hunt、Japanese、kitty、loaf、model、niece、pain、platform、rapid、rush、stairs、through、university、waterfall、wound、allow、boyfriend、chapter、dial、empty、fog、grandson、human、jar、koala、local、monster、nineteenth、painful、pleasant、rare、Russian、stamp",
  "國二下3": "throughout、upon、watermelon、wrist、alone、brain、character、diamond、encourage、foggy、grape、ill、jazz、lack、location、mop、ninetieth、painter、pleased、rat、safety、standard、throw、upstairs、wave、yard、aloud、branch、charge、diary、enemy、fool、grapefruit、imagine、jealous、lady、lock、mosquito、noisy、pajamas、pleasure、rather、sail、state、thumb、used、wedding、youth、alphabet、brave",
  "國三上1": "altogether、brick、chief、divide、equal、freezer、guitar、instant、lane、loaf、mall、neither、pardon、pocket、reach、rubber、shore、state、thus、valley、ambulance、brief、childhood、division、error、freezing、gun、instrument、lantern、local、manager、nephew、parrot、poem、reading、rude、shorts、steal、subway、toward、amount、childish、dizzy、especially、guy、intelligent、lock、mango、nervous、paste",
  "國三上2": "poison、realize、running、shout、succeed、tower、ancient、broad、childlike、document、event、haircut、interrupt、locker、manner、nest、path、pollute、reason、reject、shower、success、trace、angel、broadcast、children、dolphin、everywhere、hairdresser、interview、loser、marriage、newspaper、pattern、pollution、receive、relative、shrimp、successfully、track、anger、brunch、chin、donkey、exact、hall、introduce、loss、marry、none",
  "國三上3": "pause、pond、recent、safety、shut、such、trade、ankle、bucket、choice、dot、exam、hammer、invent、lot、mask、noodles、peace、pool、record、sail、sight、sudden、tradition、anyway、buffet、choose、double、examine、handkerchief、invite、lovely、mass、northern、peaceful、port、recover、sailing、sign、suddenly、traditional、anywhere、bug、chubby、doubt、excite、handle、iron、lychee、master",
  "國三下1": "note、peach、position、rectangle、sailor、silence、suggest、treasure、apologize、building、citizen、downstairs、exist、hang、jam、mad、mat、nut、pear、positive、recycle、salesman、silent、suit、trap、appearance、bun、claim、downtown、exit、hanger、jar、magazine、match、obey、pepper、possessive、reflexive、sample、silly、suitcase、travel、apply、bundle、clap、dragon、expect、heater、jazz、magician",
  "國三下2": "deliver、argue、blanket、exact、coast、everywhere、frighten、guide、humble、insect、judge、kitten、liquid、metal、naughty、omit、platform、quarter、refuse、single、total、ugly、victory、western、youth、zebra、arrest、blood、closet、dentist、frog、hall、hunter、insist、jeep、koala、loaf、meter、necklace、onion、pocket、review、sink、toward、underwear、value、wound、artist、blouse、cloth",
  "國三下3": "hammer、exit、asleep、board、method、clothing、describe、fry、imagine、interrupt、joke、lady、local、needle、ordinary、poem、rapid、relative、skill、tower、underpass、village、whatever、yucky、assistant、boil、coach、desert、expect、function、handkerchief、ill、introduce、journalist、lamb、location、middle、negative、organize、poison、rare、remind、skillful、trace、unit、vinegar、wheel、yummy、assume、bomb",
  "暑假上1": "impolite、attack、bone、cockroach、furniture、extra、attention、design、handle、lock、midnight、invent、neighbor、ketchup、oven、pollute、lane、rat、rent、skin、bother、track、universe、violin、while、yard、attend、collection、bookcase、coin、desire、hang、eyebrow、gain、importance、kingdom、invitation、lantern、locker、minor、neither、overpass、pollution、rather、repair、skinny、trade、upon、visitor、whole",
  "暑假上2": "diet、available、traditional、reach、develop、upstairs、nervous、bow、detect、whom、fail、diamond、overseas、vocabulary、slender、garage、diary、loss、volleyball、hanger、difference、mirror、used、impossible、difficulty、pool、invite、reading、leaf、determine、report、loser、auxiliary、minus、bowling、nephew、fair、pond、gate、reply、hardly、sleepy、iron、tradition、length、owner、wide、dessert、boyfriend、audience",
  "暑假上3": "actress、brave、control、effort、figure、guest、handle、ill、jogging、kitten、loaf、method、note、object、period、quarter、reach、search、tool、unique、vest、weight、youth、admit、broad、empty、hike、message、plastic、wave、seem、adopt、cancel、danger、exact、final、guard、insect、kingdom、location、narrow、occur、passenger、rapid、screen、trace、unit、wheel、zero、adult",
  "暑假下1": "advance、brick、cooking、elect、firm、guitar、heater、jam、koala、lock、midnight、obey、opinion、pineapple、quit、reason、secret、toothache、universe、visitor、whale、yard、affair、brief、cotton、electricity、fishing、gun、height、ink、lack、lovely、minus、ocean、onion、pigeon、race、record、select、tower、upstairs、vocabulary、whom、yummy、ahead、broadcast、cough、element、fit、guy",
  "暑假下2": "aim、brunch、courage、engine、flat、haircut、hippo、instant、lamb、magazine、mirror、offer、ordinary、pile、railroad、reject、separate、track、valuable、willing、zebra、aircraft、bucket、course、engineer、flight、hairdresser、hire、instrument、lane、magician、missing、official、organize、pingpong、rare、relative、servant、trade、value、wine、alive、buffet、court、entire、flour、hole、intelligent、lantern、mall",
  "暑假下3": "allow、bundle、crab、entrance、flow、hammer、homesick、international、liquid、mango、mix、operate、oven、platform、rather、remind、service、tradition、verb、wing、aloud、burger、cream、envelope、flute、handkerchief、honesty、interrupt、loaf、manner、model、operation、owner、pleasant、reading、rent、sheet、transportation、valley、winner、alphabet、burst、crime、environment、focus、hang、honey、interview、local、mass"
};

const primaryCategories = [
  { name: "一上", icon: "👶" }, { name: "一中", icon: "👶" }, { name: "一下", icon: "👶" },
  { name: "二上", icon: "🧒" }, { name: "二中", icon: "🧒" }, { name: "二下", icon: "🧒" },
  { name: "三上", icon: "👦" }, { name: "三中", icon: "👦" }, { name: "三下", icon: "👦" },
  { name: "四上", icon: "👧" }, { name: "四中", icon: "👧" }, { name: "四下", icon: "👧" },
  { name: "五上", icon: "🧑" }, { name: "五中", icon: "🧑" }, { name: "五下", icon: "🧑" },
  { name: "六上", icon: "👱" }, { name: "六中", icon: "👱" }, { name: "六下", icon: "👱" }
].map(c => ({ ...c, type: 'primary', words: primaryDataRaw[c.name].split(/\s*;\s*/) }));

const juniorCategories = [
  { name: "國一上1", icon: "🎓" }, { name: "國一上2", icon: "🎓" }, { name: "國一上3", icon: "🎓" },
  { name: "國一下1", icon: "🎓" }, { name: "國一下2", icon: "🎓" }, { name: "國一下3", icon: "🎓" },
  { name: "國二上1", icon: "🎓" }, { name: "國二上2", icon: "🎓" }, { name: "國二上3", icon: "🎓" },
  { name: "國二下1", icon: "🎓" }, { name: "國二下2", icon: "🎓" }, { name: "國二下3", icon: "🎓" },
  { name: "國三上1", icon: "🎓" }, { name: "國三上2", icon: "🎓" }, { name: "國三上3", icon: "🎓" },
  { name: "國三下1", icon: "🎓" }, { name: "國三下2", icon: "🎓" }, { name: "國三下3", icon: "🎓" },
  { name: "暑假上1", icon: "☀️" }, { name: "暑假上2", icon: "☀️" }, { name: "暑假上3", icon: "☀️" },
  { name: "暑假下1", icon: "☀️" }, { name: "暑假下2", icon: "☀️" }, { name: "暑假下3", icon: "☀️" }
].map(c => ({ ...c, type: 'junior', words: juniorDataRaw[c.name].split(/、/) }));

const App = () => {
  const [activeApiKey, setActiveApiKey] = useState(() => isCanvas ? "" : (getEnvKey() || getLocalKey()));
  const [keyInput, setKeyInput] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [total, setTotal] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  
  // 英雄榜專屬設定
  const [playerName, setPlayerName] = useState('');
  const [tempName, setTempName] = useState('');
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // 優化圖片載入狀態
  const [imageUrls, setImageUrls] = useState({});
  const [imgLoaded, setImgLoaded] = useState({});

  const [deckId, setDeckId] = useState(null);
  const [input, setInput] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [activePart, setActivePart] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', message: '' });
  const [pwdModal, setPwdModal] = useState({ isOpen: false, value: '', error: '' });

  const [encouragement, setEncouragement] = useState('');
  const lastMilestoneRef = useRef(0);

  const workingModelRef = useRef(isCanvas ? "gemini-2.5-flash-preview-09-2025" : "");
  const speechTimeoutRef = useRef(null);

  const [currentChoices, setCurrentChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isChoiceCorrect, setIsChoiceCorrect] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isCanvas && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("登入錯誤", err);
        setError("❌ Firebase 連線失敗，請檢查網路或專案設定。");
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return; 
    const id = new URLSearchParams(window.location.search).get('deckId');
    if (id) {
      setDeckId(id);
      getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', id))
        .then(s => {
          if (s.exists()) {
            const d = s.data();
            setCards(d.cards);
            setTotal(d.cards.length);
            setQueue(d.queue || Array.from({length: d.cards.length}, (_, i) => i));
            setHistory(d.history || { again: 0, hard: 0, good: 0, easy: 0 });
            if (d.queue?.length === 0) setIsFinished(true);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("資料讀取失敗", err);
          if (err.message.includes("permissions")) setError("❌ 資料庫權限不足！");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (cards.length > 0 && queue.length > 0) {
      const correctCard = cards[queue[0]];
      const choices = [correctCard.meaning];
      
      let attempts = 0;
      while (choices.length < 3 && attempts < 50) {
        const randomIndex = Math.floor(Math.random() * cards.length);
        const randomCard = cards[randomIndex];
        if (randomCard.word !== correctCard.word && !choices.includes(randomCard.meaning)) {
          choices.push(randomCard.meaning);
        }
        attempts++;
      }
      
      setCurrentChoices(choices.sort(() => 0.5 - Math.random()));
    }
  }, [queue[0], cards]);

  const playSimpleText = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    
    const isEnglish = /[a-zA-Z]/.test(text) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = isEnglish ? 'en-US' : 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const playWordAndFirstMeaning = (c) => {
    if (!c) return;
    window.speechSynthesis.cancel();
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    const wordUtterance = new SpeechSynthesisUtterance(c.word);
    wordUtterance.lang = 'en-US';
    wordUtterance.rate = 0.85;

    let cleanMeaning = "";
    if (c.meaning) {
       const firstLine = c.meaning.split('\n')[0];
       cleanMeaning = firstLine.replace(/\([a-zA-Z]+\.?\)|\[.*?\]/g, '').split(/[；;,，]/)[0].trim();
    } else {
       cleanMeaning = c.info ? c.info.split(' ')[0] : '';
    }

    const meaningUtterance = new SpeechSynthesisUtterance(cleanMeaning);
    meaningUtterance.lang = 'zh-TW';
    meaningUtterance.rate = 0.85;

    wordUtterance.onend = () => {
       if (cleanMeaning) {
          speechTimeoutRef.current = setTimeout(() => {
             window.speechSynthesis.speak(meaningUtterance);
          }, 500); 
       }
    };
    window.speechSynthesis.speak(wordUtterance);
  };

  const playCardSequence = (c) => {
    if (!c) return;
    window.speechSynthesis.cancel();
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    const isEnglishCard = /[a-zA-Z]/.test(c.word) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(c.word);
    const lang = isEnglishCard ? 'en-US' : 'ja-JP';

    let wordText = c.word;
    let exampleText = "";

    if (c.example || (c.info && c.info.includes('【例句】'))) {
      let exEn = c.example || "";
      if (!exEn && c.info && c.info.includes('【例句】')) {
        const exStr = c.info.split('【例句】')[1];
        const match = exStr.match(/^(.*?)\((.*?)\)(.*)$/);
        if (match) {
          exEn = match[1].trim();
        } else {
          exEn = exStr;
        }
      }
      exampleText = exEn.replace(/\s\/\s/g, '. ');
    }

    const speakPart = (text, onEndCallback) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.85;
      if (onEndCallback) {
        u.onend = onEndCallback;
      }
      window.speechSynthesis.speak(u);
    };

    if (exampleText) {
      speakPart(wordText, () => {
        speechTimeoutRef.current = setTimeout(() => {
          speakPart(exampleText);
        }, 1000);
      });
    } else {
      speakPart(wordText);
    }
  };

  const handleAction = async (type) => {
    const curr = queue[0];
    let nextQ = [...queue];
    nextQ.shift();
    const nextH = { ...history, [type]: history[type] + 1 };
    setHistory(nextH);

    setSelectedChoice(null);
    setIsChoiceCorrect(false);

    if (type === 'again') nextQ.splice(1, 0, curr);
    else if (type === 'hard') nextQ.splice(Math.floor(nextQ.length/2), 0, curr);
    else if (type === 'good') nextQ.push(curr);
    
    setQueue(nextQ);
    if (nextQ.length === 0) {
      setIsFinished(true);
    } else {
      setIsFlipped(false);
    }
    
    if (deckId && user) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { queue: nextQ, history: nextH });
      } catch(err) {}
    }
  };

  const handleShuffle = async () => {
    if (queue.length <= 1) return;
    const newQueue = [...queue];
    for (let i = newQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
    }
    setQueue(newQueue);
    setIsFlipped(false);
    
    setSelectedChoice(null);
    setIsChoiceCorrect(false);

    if (deckId && user) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', deckId), { queue: newQueue });
      } catch(err) {}
    }
  };

  const openConfirm = (type, message) => setConfirmDialog({ isOpen: true, type, message });
  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', message: '' });

  const executeConfirm = () => {
    if (confirmDialog.type === 'home') {
      setCards([]); setQueue([]); setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false); setIsFlipped(false); setDeckId(null); setInput('');
      lastMilestoneRef.current = 0;
      setActiveCategory(null);
      setActivePart(1);
      setIsReadyToPlay(false);
      
      setSelectedChoice(null);
      setIsChoiceCorrect(false);

      safePushState(window.location.pathname);
    } else if (confirmDialog.type === 'finish') {
      setIsFinished(true);
    }
    closeConfirm();
  };

  const validateAndSaveKey = async () => {
    const tk = keyInput.trim();
    if (!tk) return;

    if (tk === firebaseConfig.apiKey || tk === "AIzaSyBTcPWX29sXFY0dqzOpJn8We6uoJLwHv9U") {
      setError('🚨 這把是「Firebase 資料庫」的鑰匙！請前往 Google AI Studio 申請真正的 AI 鑰匙！');
      return;
    }

    setIsValidatingKey(true); setError('');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${tk}`);
      if (!res.ok) {
        const data = await res.json();
        setError(`❌ 驗證失敗 (${res.status}): ${data.error?.message || "未知錯誤"}`);
        setIsValidatingKey(false);
        return;
      }
      
      const data = await res.json();
      const validModels = (data.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent")).map(m => m.name.replace("models/", ""));
      const preferred = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-pro"];
      workingModelRef.current = preferred.find(p => validModels.includes(p)) || validModels[0] || "";

      localStorage.setItem('my_gemini_key', tk);
      setActiveApiKey(tk);
    } catch (e) {
      setError("❌ 網路異常，無法驗證金鑰。");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const generate = async (overrideText = null) => {
    const targetText = typeof overrideText === 'string' ? overrideText : input;

    if (typeof overrideText !== 'string') {
      setActiveCategory(null);
    }

    if (!targetText.trim() || genLoading) return;
    const reqKey = isCanvas ? "" : activeApiKey;
    if (!reqKey && !isCanvas) {
      setError('❌ 找不到 API 金鑰！請確認 Vercel 環境變數 VITE_GEMINI_API_KEY。');
      return;
    }

    setCards([]);
    setImgLoaded({});
    setIsFinished(false);
    setIsReadyToPlay(false);
    setGenLoading(true); 
    setError('🔍 正在請 AI 為單字擴充詞性與例句...');
    
    setSelectedChoice(null);
    setIsChoiceCorrect(false);

    const engWordCount = (targetText.match(/[a-zA-Z]+/g) || []).length;
    const hasKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(targetText);
    const hasChinese = /[\u4E00-\u9FFF]/.test(targetText);

    let isEn = false;
    if (hasKana) {
        isEn = false; 
    } else if (engWordCount >= 10) {
        isEn = true;  
    } else if (engWordCount > 0 && !hasChinese) {
        isEn = true;  
    } else {
        isEn = false; 
    }
    
    const prompt = isEn 
      ? `請分析以下文字：\n"""${targetText}"""\n這是一份「英文學習清單」。請提取出所有英文單字（務必完整包含輸入的所有單字，不可遺漏！）。\n⚠️極度重要：如果文字中混雜了單獨的「中文詞彙」，請務必自動將其「翻譯成英文單字」。\n請為每個單字提供更廣泛且結構化的解釋：\n1. 包含不同「詞性」的意思，並換行顯示。⚠️【最重要】：請務必把最簡單、最常用的中文意思放在第一行的最前面（例如：書；(n.) 書本），幫助快速記憶。\n2. 補充類似的「同類詞、同義詞」或相反的「反義詞」。例如：[同義詞] reserve, order / [反義詞] cancel\n3. 提供對應的英文例句，若有多個詞性請提供多句，並用「 / 」隔開。\n4. 提供對應的中文翻譯，多句請用「 / 」隔開。\n回傳 JSON 陣列：[{"word": "英文單字", "reading": "音標", "meaning": "不同詞性與意思(務必使用 \\n 換行，最簡單的意思放最前)", "breakdown": "同義詞/反義詞補充", "example": "英文例句1 / 英文例句2", "example_kana": "", "example_zh": "中文翻譯1 / 中文翻譯2", "image_keyword": "用1到3個英文單字描述單字畫面的關鍵字"}]。請只回傳 JSON。`
      : `請分析以下文字：\n"""${targetText}"""\n這是一份「日文學習清單」。\n⚠️極度重要：即使使用者輸入的全部都是「純中文」，你也必須把它當作是想要學習的目標，自動將這些中文「翻譯成對應的日文單字」，並為其建立日文單字卡！\n回傳 JSON 陣列：[{"word": "日文單字(若來源為中文請翻譯成日文)", "reading": "讀音", "meaning": "詞性與意思 (若是動詞，務必明確標註為：第一/二/三類動詞)", "breakdown": "字句拆解(例如:根強い=根+強い)與意象化連結說明 (💡請提供生動、好記的比喻或字根字首解析來幫助記憶)", "example": "例句", "example_kana": "例句平假名", "example_zh": "翻譯", "image_keyword": "用1到3個英文單字描述單字畫面的關鍵字(用來搜尋圖片)"}]。請只回傳 JSON。`;

    let modelToUse = isCanvas ? "gemini-2.5-flash-preview-09-2025" : workingModelRef.current;

    if (!modelToUse) {
        try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${reqKey}`);
            if (!listRes.ok) {
                if (listRes.status === 403) {
                    setError(`🚨 致命錯誤 (403)：您的金鑰完全沒有開通「AI 生成權限」！\n👉 請用一個全新的 Google 帳號，前往 aistudio.google.com 重新申請一把！`);
                } else if (listRes.status === 400) {
                    setError(`🚨 致命錯誤 (400)：這把金鑰是假的或格式錯誤！`);
                    setActiveApiKey('');
                    try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                } else {
                    const errData = await listRes.json();
                    setError(`❌ Google 拒絕連線 (${listRes.status}): ${errData.error?.message}`);
                }
                setGenLoading(false);
                return;
            }

            const listData = await listRes.json();
            const validModels = (listData.models || [])
                .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                .map(m => m.name.replace("models/", ""));

            if (validModels.length === 0) {
                 setError(`🚨 驚人發現：鑰匙是真的，但 Google 說您「擁有 0 個可用模型」！\n👉 唯一解法：請用一個「全新的 Google 帳號」，登入 aistudio.google.com 重新申請！`);
                 setGenLoading(false);
                 return;
            }

            const preferred = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-pro"];
            modelToUse = preferred.find(p => validModels.includes(p)) || validModels[0];
            workingModelRef.current = modelToUse;

        } catch (e) {
            setError(`❌ 掃描模型失敗：請檢查網路連線。`);
            setGenLoading(false);
            return;
        }
    }

    setError(''); 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${reqKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    let success = false;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429 || res.status === 503) {
                    await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
                    lastError = "⏳ 伺服器目前接收到太多請求，請稍等幾秒後再試！";
                    continue; 
                } 
                if (res.status === 400 || res.status === 403) {
                    setActiveApiKey('');
                    workingModelRef.current = "";
                    try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                    lastError = `🚨 您的 API 金鑰無效或權限被收回，請重新設定！`;
                    break;
                }
                if (res.status === 404) {
                    workingModelRef.current = ""; 
                    lastError = `🚨 模型 ${modelToUse} 突然失效，請再點擊一次重新掃描。`;
                    break;
                }
                
                lastError = `發生錯誤：${data.error?.message || "未知錯誤"}`;
                break;
            }
            
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
            
            const newCards = parsed.map(c => ({
              word: c.word,
              reading: c.reading || '',
              meaning: c.meaning || '',
              breakdown: c.breakdown || '',
              example: c.example || '',
              example_kana: c.example_kana || '',
              example_zh: c.example_zh || '',
              image_keyword: c.image_keyword || 'study',
              info: `${c.reading || ''} ${c.meaning || ''} 💡 [分析] ${c.breakdown || ''} 【例句】${c.example || ''}(${c.example_kana || ''})${c.example_zh || ''}`
            }));
            
            setCards(newCards);
            setQueue(Array.from({length: newCards.length}, (_, i) => i));
            setTotal(newCards.length);
            setIsFinished(false); setIsFlipped(false);
            success = true;
            lastMilestoneRef.current = 0;
            break; 
            
        } catch (e) { 
            if (attempt < 2) {
                await new Promise(r => setTimeout(r, 2000));
            } else {
                lastError = `系統連線異常：請稍後再試。`;
            }
        }
    }

    if (!success) setError(`❌ ${lastError}`);
    setGenLoading(false);
  };

  const loadPresetCategory = (cat, part = 1) => {
    setActiveCategory(cat);
    setActivePart(part);
    
    setSelectedChoice(null);
    setIsChoiceCorrect(false);

    let vocabList = [];
    let useAI = true;

    if (cat.type === 'kinder') {
       useAI = false;
       vocabList = kinderVocab.slice(cat.start, cat.end);
    } else {
       useAI = true;
       const fullList = cat.words.map(w => ({ word: w, meaning: '' }));
       if (part === 1) {
          vocabList = fullList.slice(0, 25);
       } else {
          vocabList = fullList.slice(25);
       }
    }

    const wordsOnlyStr = vocabList.map(item => item.word).join('\n');
    setInput(wordsOnlyStr);

    if (useAI) {
      generate(wordsOnlyStr); 
    } else {
      const newCards = vocabList.map(item => ({
        word: item.word,
        reading: '',
        meaning: item.meaning,
        breakdown: '',
        example: '',
        example_kana: '',
        example_zh: '',
        image_keyword: item.word, 
        info: item.meaning 
      }));
      
      setCards(newCards);
      setImgLoaded({});
      setQueue(Array.from({length: newCards.length}, (_, i) => i));
      setTotal(newCards.length);
      setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
      setIsFinished(false); 
      setIsFlipped(false);
      setIsReadyToPlay(false);
      lastMilestoneRef.current = 0;
      setError('');
    }
  };

  useEffect(() => {
    if (cards.length === 0 || isFinished) return;

    const loadImages = async () => {
      const nextCards = queue.slice(0, 4).map(idx => cards[idx]);
      for (const card of nextCards) {
        if (!card || imageUrls[card.word]) continue;
        
        let imgQuery = card.image_keyword || card.word || "study";
        
        if (!/[a-zA-Z]/.test(imgQuery)) {
            imgQuery = card.word + " photography object";
        } else {
            imgQuery = imgQuery + " photography";
        }
        
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgQuery)}?width=400&height=300&nologo=true&seed=${card.word.length + Math.floor(Math.random() * 100)}`;
        setImageUrls(prev => ({ ...prev, [card.word]: url }));
      }
    };
    loadImages();
  }, [queue, cards, isFinished, imageUrls]);

  useEffect(() => {
    if (queue.length > 0 && !isFinished && cards.length > 0) {
      if (isFlipped) {
        const currentCard = cards[queue[0]];
        const isEnglishCard = /[a-zA-Z]/.test(currentCard.word) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(currentCard.word);
        
        if (isEnglishCard) {
           playWordAndFirstMeaning(currentCard);
        } else {
           playCardSequence(currentCard);
        }
      }
    }
  }, [queue, isFlipped, isFinished, cards]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && cards.length > 0 && !isFinished && isReadyToPlay) {
        if (!isFlipped) setIsFlipped(true);
        else {
           const currentCard = cards[queue[0]];
           const isEnglishCard = /[a-zA-Z]/.test(currentCard.word) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(currentCard.word);
           if (isEnglishCard) {
              playWordAndFirstMeaning(currentCard);
           } else {
              playCardSequence(currentCard);
           }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, cards, queue, isFinished, isReadyToPlay]);

  useEffect(() => {
    if (total === 0 || isFinished) return;
    const completedCount = total - queue.length;
    
    if (completedCount > 0 && completedCount % 10 === 0 && completedCount !== lastMilestoneRef.current && completedCount !== total) {
      const messages = [
        "你好厲害！🎉", "你真是記單字高手！💪", "你好強！🔥", 
        "快要完成了哦！🚀", "有點厲害！😎", "太棒了！✨", 
        "無人能敵！👑", "繼續保持！🎯"
      ];
      setEncouragement(messages[Math.floor(Math.random() * messages.length)]);
      lastMilestoneRef.current = completedCount;

      setTimeout(() => {
        setEncouragement('');
      }, 2500);
    }
  }, [queue.length, total, isFinished]);

  const getRating = () => {
    const t = history.again + history.hard + history.good + history.easy;
    if (t === 0) return { score: 0, text: "尚未作答", color: "text-slate-500", emoji: "🤔" };
    const score = Math.round(((history.easy * 100) + (history.good * 100) + (history.hard * 50)) / t);
    if (score >= 90) return { score, text: "極佳", color: "text-green-500", emoji: "🏆" };
    if (score >= 60) return { score, text: "穩定", color: "text-blue-500", emoji: "🌟" };
    return { score, text: "加油", color: "text-orange-500", emoji: "💪" };
  };

  // 英雄榜存取邏輯
  useEffect(() => {
    let isMounted = true;
    if (isFinished) {
      const fetchAndSubmit = async () => {
        setIsSubmittingScore(true);
        try {
           if (!user) return;
           
           // 送出成績
           if (playerName && total > 0) {
               const r = getRating();
               const docId = Date.now().toString() + Math.random().toString(36).substring(2);
               await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'global_leaderboard', docId), {
                  name: playerName,
                  score: r.score,
                  category: activeCategory ? activeCategory.name : '自訂單字',
                  timestamp: new Date().toISOString()
               });
           }

           // 取得最新英雄榜 (遵循安全規則：全抓後在本地排序)
           const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'global_leaderboard'));
           const docs = [];
           querySnapshot.forEach((d) => docs.push(d.data()));
           docs.sort((a, b) => b.score - a.score);
           if (isMounted) setLeaderboard(docs.slice(0, 10));

        } catch (err) {
           console.error("Leaderboard error", err);
        } finally {
           if (isMounted) setIsSubmittingScore(false);
        }
      };
      fetchAndSubmit();
    }
    return () => { isMounted = false; };
  }, [isFinished]);

  const renderCardBackText = (card) => {
    if (!card) return null;
    const isEnglishCard = /[a-zA-Z]/.test(card.word) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(card.word);
    
    let reading = card.reading || '';
    let meaning = card.meaning || '';
    let breakdown = card.breakdown || '';
    let exEn = card.example || '';
    let exKana = card.example_kana || '';
    let exZh = card.example_zh || '';
    
    if (!meaning && card.info) {
       const mainPart = card.info.split('【例句】')[0].trim();
       const parts = mainPart.split('💡').map(p => p.trim());
       const headerText = parts[0];
       const firstSpaceIdx = headerText.indexOf(' ');
       
       if (firstSpaceIdx !== -1) {
         reading = headerText.substring(0, firstSpaceIdx).trim();
         meaning = headerText.substring(firstSpaceIdx).trim();
       } else {
         meaning = headerText;
       }
       
       const extraSections = parts.slice(1);
       if (extraSections.length > 0) {
         breakdown = extraSections.map(s => s.replace(/\[.*?\]\s*/, '').trim()).join('\n');
       }
       
       if (card.info.includes('【例句】')) {
         const exStr = card.info.split('【例句】')[1];
         const match = exStr.match(/^(.*?)\((.*?)\)(.*)$/);
         if (match) {
           exEn = match[1].trim();
           exKana = match[2].trim();
           exZh = match[3].trim();
         } else {
           exEn = exStr;
         }
       }
    }

    return (
      <div className="flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar flex flex-col text-left">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 leading-tight">
          
          <div className="flex items-center flex-wrap gap-2 mb-2 w-full">
            <span className="text-3xl font-black text-indigo-900 tracking-wide">{card.word}</span>
            {reading && <span className="text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">{reading}</span>}
            <button onClick={(e) => { e.stopPropagation(); playSimpleText(card.word); }} className="ml-auto w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 hover:scale-110 transition-all shadow-sm shrink-0">
              <Volume2 size={20} />
            </button>
          </div>
          
          <div className="text-slate-700 text-lg mb-2 whitespace-pre-line leading-snug font-bold">
            {meaning}
          </div>
          
          {breakdown && (
            <div className="mt-2 text-sm text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-100/50 leading-relaxed font-bold shadow-sm whitespace-pre-line">
              💡 {breakdown}
            </div>
          )}
        </div>

        {(exEn || exZh) && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2 space-y-2">
            {exEn && <div className="text-base sm:text-lg font-black text-slate-800 leading-tight tracking-wide whitespace-pre-line">{exEn.replace(/\s\/\s/g, '\n')}</div>}
            {exKana && !isEnglishCard && <div className="text-[13px] font-bold text-indigo-500 leading-tight whitespace-pre-line">{exKana.replace(/\s\/\s/g, '\n')}</div>}
            {exZh && <div className="text-sm font-bold text-slate-600 leading-tight whitespace-pre-line">{exZh.replace(/\s\/\s/g, '\n')}</div>}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  if (!isCanvas && !activeApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-inner">
             <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-4">系統安全鎖</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold border border-red-100 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <p className="text-[13px] text-slate-500 mb-6 font-medium text-left leading-relaxed">
            請前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 underline font-bold">Google AI Studio</a> 申請金鑰。<br/><br/>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">系統會自動驗證金鑰是否有效！</span>
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            disabled={isValidatingKey}
            placeholder="請貼上 AIzaSy 開頭的 AI 金鑰..."
            className="w-full p-4 mb-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium transition-colors disabled:opacity-50"
          />
          <button
            onClick={validateAndSaveKey}
            disabled={!keyInput.trim() || isValidatingKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
          >
            {isValidatingKey ? <Loader2 size={18} className="animate-spin" /> : null}
            {isValidatingKey ? '驗證中...' : '驗證進入 App'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
      
      {pwdModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">清除系統快取</h3>
            <p className="text-xs text-slate-500 mb-6">這會清除本地所有的記憶金鑰</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPwdModal({ isOpen: false, value: '', error: '' })} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">取消</button>
              <button onClick={() => {
                  setActiveApiKey('');
                  workingModelRef.current = ""; 
                  try { localStorage.removeItem('my_gemini_key'); } catch(e){}
                  setPwdModal({ isOpen: false, value: '', error: '' });
                  setError("已清除舊金鑰！");
              }} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-md">確認清除</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
        <Brain className="text-indigo-600 w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-6 text-slate-800">Killer Cards</h1>
        
        <div className="bg-indigo-50/50 p-4 rounded-2xl mb-5 border border-indigo-100">
          <div className="text-[13px] font-black text-indigo-800 mb-3 text-left flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            免輸入！一鍵請 AI 擴充詞性與例句
          </div>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 pb-1">
            
            <div className="grid grid-cols-3 gap-2.5 mb-2.5">
              {kinderCategories.map((cat, index) => (
                <button 
                  key={`kinder-${index}`}
                  onClick={() => loadPresetCategory(cat, 1)} 
                  className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold py-2.5 px-1 rounded-xl text-[13px] sm:text-[14px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1 active:scale-95"
                >
                  <span className="text-2xl drop-shadow-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-indigo-200 my-5 relative">
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-50 px-3 text-[11px] font-black tracking-widest text-indigo-400 uppercase rounded-full border border-indigo-100">
                Tier 1核心單字
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {primaryCategories.map((cat, index) => (
                <button 
                  key={`primary-${index}`}
                  onClick={() => loadPresetCategory(cat, 1)} 
                  className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold py-2.5 px-1 rounded-xl text-[13px] sm:text-[14px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1 active:scale-95"
                >
                  <span className="text-2xl drop-shadow-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-indigo-200 my-5 relative">
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-50 px-3 text-[11px] font-black tracking-widest text-indigo-400 uppercase rounded-full border border-indigo-100">
                國中與進階挑戰區
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {juniorCategories.map((cat, index) => (
                <button 
                  key={`junior-${index}`}
                  onClick={() => loadPresetCategory(cat, 1)} 
                  className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold py-2.5 px-1 rounded-xl text-[13px] sm:text-[14px] transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1 active:scale-95"
                >
                  <span className="text-2xl drop-shadow-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

          </div>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold tracking-wider">或輸入自訂單字</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <textarea 
          value={input} 
          onChange={e => {
            setInput(e.target.value);
            setActiveCategory(null); 
          }} 
          placeholder="貼上想背的單字..." 
          className="w-full h-32 p-5 mb-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium resize-none shadow-inner" 
        />
        
        {error && (
          <div className={`p-4 rounded-2xl text-[12px] font-bold mb-4 text-left flex gap-2 leading-relaxed whitespace-pre-wrap ${error.includes('連線失敗') || error.includes('發現') || error.includes('錯誤') || error.includes('系統異常') || error.includes('異常') || error.includes('限制') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {error.includes('請求') || error.includes('掃描') || error.includes('請 AI 為單字擴充') ? <Clock size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
            {error}
          </div>
        )}

        <button onClick={() => generate(input)} disabled={genLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {genLoading ? <Loader2 className="animate-spin" /> : <Star size={20} className="text-yellow-300" />} {genLoading ? '處理中...' : 'AI 智慧生成單字卡'}
        </button>
        
        <div className="mt-8 text-slate-300 text-[10px] font-black tracking-widest flex items-center justify-center">
          <span>v15 全球英雄榜版 for Chloe byKC</span>
        </div>
      </div>
    </div>
  );

  // --- 新增：測驗前 輸入大名與準備畫面 ---
  if (cards.length > 0 && !isFinished && !isReadyToPlay) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <Trophy className="text-amber-400 w-20 h-20 mx-auto mb-6 drop-shadow-sm" />
          <h2 className="text-2xl font-black mb-2 text-slate-800">英雄登入</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">請輸入大名，準備將您的佳績寫入全球排行榜！</p>

          <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-200">
            <div className="text-[13px] font-bold text-slate-500 mb-2 text-left">輸入大名</div>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              placeholder="例如：單字大師..."
              className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-black text-slate-700 transition-colors"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setPlayerName(tempName.trim() || '無名英雄');
                  setIsReadyToPlay(true);
                }
              }}
            />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => { setPlayerName('無名英雄'); setIsReadyToPlay(true); }}
              className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black transition-all hover:bg-slate-300 shadow-sm text-sm"
            >
              略過 ⏭️
            </button>
            <button
              onClick={() => { setPlayerName(tempName.trim() || '無名英雄'); setIsReadyToPlay(true); }}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-xl hover:bg-indigo-700 flex justify-center items-center gap-2"
            >
              🚀 開始測驗！
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 更新：測驗後 顯示分數、英雄榜、新版按鈕 ---
  if (isFinished) {
    const r = getRating();
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md w-full">
          
          {/* Top: 個人分數區塊 */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 mb-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
             <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Your Result</div>
             <h2 className="text-xl font-black text-indigo-900 truncate mb-1">{playerName || '無名英雄'}</h2>
             <div className={`text-4xl font-black ${r.color} drop-shadow-sm flex items-center justify-center gap-2`}>
                {r.emoji} {r.score} <span className="text-lg text-indigo-400">分</span>
             </div>
          </div>

          {/* Middle: 細部統計 */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex flex-col items-center justify-center">
              <p className="text-red-600 font-black text-xl mb-1">{history.again}</p>
              <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest">Again</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex flex-col items-center justify-center">
              <p className="text-orange-600 font-black text-xl mb-1">{history.hard}</p>
              <p className="text-orange-500 text-[9px] font-bold uppercase tracking-widest">Hard</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col items-center justify-center">
              <p className="text-blue-600 font-black text-xl mb-1">{history.good}</p>
              <p className="text-blue-500 text-[9px] font-bold uppercase tracking-widest">Good</p>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
              <p className="text-green-600 font-black text-xl mb-1">{history.easy}</p>
              <p className="text-green-500 text-[9px] font-bold uppercase tracking-widest">Easy</p>
            </div>
          </div>

          {/* Bottom: 全球英雄榜 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6">
            <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center justify-center gap-1.5">
              <Trophy size={16} className="text-amber-500"/> 全球英雄榜 Top 10
            </h3>
            {isSubmittingScore ? (
               <div className="py-4"><Loader2 className="animate-spin mx-auto text-indigo-400" /></div>
            ) : (
               <div className="space-y-2 text-sm text-left">
                  {leaderboard.length === 0 ? (
                     <p className="text-center text-slate-400 font-bold py-2">目前尚無紀錄，成為榜首吧！</p>
                  ) : (
                     leaderboard.map((lb, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                           <div className="flex items-center gap-2.5 overflow-hidden">
                              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i===0?'bg-amber-100 text-amber-600':i===1?'bg-slate-200 text-slate-600':i===2?'bg-orange-100 text-orange-600':'bg-slate-50 text-slate-400'}`}>
                                 {i+1}
                              </span>
                              <span className="font-bold text-slate-700 truncate max-w-[90px] sm:max-w-[120px]">{lb.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[60px]">{lb.category}</span>
                           </div>
                           <span className="font-black text-indigo-600 shrink-0">{lb.score} 分</span>
                        </div>
                     ))
                  )}
               </div>
            )}
          </div>
          
          {activeCategory && activeCategory.type !== 'kinder' && activePart === 1 && (
            <button 
              onClick={() => loadPresetCategory(activeCategory, 2)} 
              disabled={genLoading || isSubmittingScore}
              className="w-full mb-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all disabled:opacity-75 disabled:scale-100"
            >
              {genLoading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              {genLoading ? '正在準備下半關，請稍候...' : '⚡ 進入下半關 (第 26~50 個單字)'}
            </button>
          )}

          {/* 新版按鈕區：重新測驗 / 返回單元 / 返回首頁 */}
          <div className="flex flex-col gap-2.5 w-full mt-2">
             <div className="flex gap-2.5 w-full">
                <button onClick={() => {
                   setQueue(Array.from({length: cards.length}, (_, i) => i)); 
                   setHistory({again:0, hard:0, good:0, easy:0}); 
                   setIsFinished(false); 
                   lastMilestoneRef.current = 0; 
                   setSelectedChoice(null); setIsChoiceCorrect(false);
                }} disabled={genLoading || isSubmittingScore} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-xl hover:bg-black transition-all disabled:opacity-50 text-[13px] sm:text-base">
                   <RefreshCcw size={16} />重新測驗
                </button>
                <button onClick={() => {
                   setCards([]); setQueue([]); setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
                   setIsFinished(false); setIsFlipped(false); setDeckId(null); setInput('');
                   lastMilestoneRef.current = 0;
                   setIsReadyToPlay(false);
                   setSelectedChoice(null); setIsChoiceCorrect(false);
                }} disabled={genLoading || isSubmittingScore} className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-100 font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-indigo-100 transition-all disabled:opacity-50 text-[13px] sm:text-base">
                   <Brain size={16} />返回單元
                </button>
             </div>
             <button onClick={() => {
                setCards([]); setQueue([]); setHistory({ again: 0, hard: 0, good: 0, easy: 0 });
                setIsFinished(false); setIsFlipped(false); setDeckId(null); setInput('');
                lastMilestoneRef.current = 0;
                setActiveCategory(null);
                setActivePart(1);
                setIsReadyToPlay(false);
                setSelectedChoice(null); setIsChoiceCorrect(false);
                safePushState(window.location.pathname);
             }} disabled={genLoading || isSubmittingScore} className="w-full bg-slate-100 text-slate-600 border border-slate-200 font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-200 transition-all disabled:opacity-50 text-[13px] sm:text-base">
                <Home size={16} />返回首頁
             </button>
          </div>

        </div>
      </div>
    );
  }

  const card = cards[queue[0]];
  const progress = total === 0 ? 0 : ((total - queue.length) / total) * 100;
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 font-sans text-slate-800 h-[100dvh] relative overflow-hidden">
      
      {encouragement && (
        <div className="fixed top-[25%] left-1/2 transform -translate-x-1/2 z-[100] animate-bounce pointer-events-none">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-6 py-3 rounded-full shadow-2xl text-lg sm:text-xl whitespace-nowrap border-4 border-white">
            {encouragement}
          </div>
        </div>
      )}

      {shareModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4"><Share2 size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">進度已儲存！</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">請複製下方專屬網址，傳給朋友或用手機打開就能繼續背單字囉：</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 flex items-center gap-2">
              <input type="text" readOnly value={shareModal.url} className="w-full bg-transparent text-sm text-slate-600 font-medium outline-none" />
            </div>
            <button onClick={() => { try { navigator.clipboard.writeText(shareModal.url); } catch(e){} setShareModal({ isOpen: false, url: '' }); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-md flex justify-center items-center gap-2">
              <Check size={18} /> 複製並關閉
            </button>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-800 mb-6">{confirmDialog.message}</h3>
            <div className="flex gap-3">
              <button onClick={closeConfirm} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">取消</button>
              <button onClick={executeConfirm} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">確定</button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRatingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            <h3 className="text-xl font-black text-slate-800 mb-2">目前學習表現</h3>
            <div className="text-6xl my-4 drop-shadow-md">{getRating().emoji}</div>
            <div className={`text-4xl font-black ${getRating().color} mb-1 drop-shadow-sm`}>{getRating().score} 分</div>
            <div className="text-lg font-bold text-slate-600 mb-6">{getRating().text}</div>
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
              <div className="text-sm font-bold text-slate-500 mb-1 tracking-wide">目前完成率</div>
              <div className="text-2xl font-black text-indigo-600">{Math.round(progress)}%</div>
            </div>
            <button onClick={() => setShowRatingModal(false)} className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg">繼續練習</button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="w-full max-w-md mb-3 space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-700 font-black text-lg bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <button onClick={() => openConfirm('home', '確定放棄進度回首頁？')} className="text-slate-400 hover:text-red-500"><Home size={18}/></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <Brain size={20} className="text-indigo-600" />
            <span>{total - queue.length} <span className="text-slate-400 text-sm font-medium">/ {total}</span></span>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={handleShuffle} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="隨機洗牌"><Shuffle size={18}/></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => setShowRatingModal(true)} className="flex items-center gap-1 text-[13px] text-amber-600 hover:text-amber-700 transition-colors font-bold">📊 評分</button>
          </div>
          
          <button onClick={async () => {
            if (!user) return setError("尚未連線資料庫");
            if (isSaving) return;
            setIsSaving(true);
            try {
              let shareId = deckId || crypto.randomUUID();
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'decks', shareId), { cards, queue, history, creator: user.uid, createdAt: new Date().toISOString() });
              setDeckId(shareId); safePushState(`?deckId=${shareId}`);
              const url = `${window.location.origin}${window.location.pathname}?deckId=${shareId}`;
              try { await navigator.clipboard.writeText(url); } catch(e) {}
              setCopyOk(true); setTimeout(() => setCopyOk(false), 2000);
              setShareModal({ isOpen: true, url });
            } catch (err) { setError("儲存失敗"); } 
            finally { setIsSaving(false); }
          }} disabled={isSaving} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${copyOk ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : copyOk ? <Check size={16} /> : <Share2 size={16} />}
            {copyOk ? '已複製連結' : '儲存與分享'}
          </button>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
          <div className="bg-indigo-500 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative w-full max-w-md flex-1 min-h-[450px] cursor-pointer perspective-1000 group mb-2" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col items-center justify-between p-6 border border-slate-100">
            <div className="flex flex-col items-center justify-center flex-1 w-full gap-4">
              <h2 className="text-[3rem] sm:text-[3.5rem] font-black text-slate-800 text-center leading-tight tracking-wide drop-shadow-sm w-full break-words">
                {card.word}
              </h2>
              <button onClick={e => { e.stopPropagation(); playSimpleText(card.word); }} className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm shrink-0">
                <Volume2 size={28} />
              </button>
            </div>

            <div className="w-full flex flex-col gap-2.5 mb-4 shrink-0">
              {currentChoices.map((choice, idx) => {
                let btnClass = "bg-slate-50 text-slate-600 active:bg-indigo-50 active:text-indigo-700 border-slate-200 active:border-indigo-200 sm:hover:bg-indigo-50 sm:hover:text-indigo-700 sm:hover:border-indigo-200";
                if (selectedChoice !== null) {
                  if (choice === card.meaning) {
                    btnClass = "bg-green-100 text-green-700 border-green-400 shadow-sm"; 
                  } else if (selectedChoice === idx) {
                    btnClass = "bg-red-100 text-red-700 border-red-300"; 
                  } else {
                    btnClass = "bg-slate-50 text-slate-400 border-slate-100 opacity-50"; 
                  }
                }

                return (
                  <button
                    key={`${card.word}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedChoice !== null) return; 
                      setSelectedChoice(idx);
                      const isCorrect = (choice === card.meaning);
                      setIsChoiceCorrect(isCorrect);
                      
                      setTimeout(() => {
                        setIsFlipped(true);
                      }, 600);
                    }}
                    className={`w-full p-4 sm:py-4 rounded-xl border text-[16px] sm:text-[18px] font-black transition-all text-left overflow-hidden text-ellipsis line-clamp-2 leading-relaxed ${btnClass}`}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>

            <div className="text-slate-400 text-[10px] font-bold tracking-widest uppercase shrink-0">
              [ 答對才能解鎖 Easy 按鈕 ]
            </div>
          </div>
          
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2rem] shadow-xl flex flex-col p-4 sm:p-5 overflow-hidden border border-slate-100">
            
            <div className="w-full h-36 sm:h-40 bg-slate-100 rounded-xl mb-3 overflow-hidden relative flex items-center justify-center shadow-inner shrink-0">
              {!imgLoaded[card.word] && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 bg-slate-100 z-0">
                  <Loader2 className="w-6 h-6 animate-spin mb-1" />
                  <span className="text-[10px] font-black uppercase">Loading...</span>
                </div>
              )}
              {imageUrls[card.word] && (
                <img 
                  src={imageUrls[card.word]} 
                  className={`w-full h-full object-cover z-10 transition-opacity duration-300 ${imgLoaded[card.word] ? 'opacity-100' : 'opacity-0'}`} 
                  alt="" 
                  onLoad={() => setImgLoaded(prev => ({ ...prev, [card.word]: true }))}
                  onError={e => {
                    // 若原圖庫請求失敗，切換至更穩定的真實風景圖，避免出現醜醜的英文字替代圖
                    if (!e.target.src.includes('picsum.photos')) {
                      e.target.src = `https://picsum.photos/seed/${encodeURIComponent(card.word)}/400/300`;
                    }
                    setImgLoaded(prev => ({ ...prev, [card.word]: true }));
                  }} 
                />
              )}
            </div>

            {renderCardBackText(card)}

            <div className="grid grid-cols-5 gap-2 mt-auto pt-3 border-t border-slate-100 shrink-0 items-end pb-1">
              <button onClick={(e) => { e.stopPropagation(); handleAction('again'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-red-50 text-red-600 border border-red-100"><RefreshCcw size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-red-500">Again</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleAction('hard'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-orange-50 text-orange-600 border border-orange-100"><Flame size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-orange-500">Hard</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); playCardSequence(card); }} className="flex flex-col items-center justify-start gap-1.5 hover:scale-105 active:scale-95 transition-all -mt-3 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg bg-indigo-600 text-white border-4 border-indigo-100 group-hover:bg-indigo-700">
                  <Volume2 size={32} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Listen</span>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleAction('good'); }} className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm bg-blue-50 text-blue-600 border border-blue-100"><Star size={24} /></div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-500">Good</span>
              </button>

              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (isChoiceCorrect) handleAction('easy'); 
                }} 
                disabled={!isChoiceCorrect}
                className={`flex flex-col items-center gap-1.5 transition-all ${!isChoiceCorrect ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm border ${!isChoiceCorrect ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-green-50 text-green-600 border-green-100'}`}>
                  {!isChoiceCorrect ? <Lock size={20} /> : <Zap size={24} />}
                </div>
                <span className={`text-xs font-black uppercase tracking-wider ${!isChoiceCorrect ? 'text-slate-400' : 'text-green-500'}`}>Easy</span>
              </button>
            </div>

          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }` }} />
    </div>
  );
};

export default App;