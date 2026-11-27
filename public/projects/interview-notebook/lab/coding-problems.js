/* Runnable contracts for exercises in the Interview Notebook tracker. */
window.NotebookProblems = [
  {
    id: "amazon-part-search",
    company: "Amazon",
    title: "Complete a replacement-part search",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read parts (unique [lowercase ASCII name, request count] pairs), prefix (a possibly empty string), and k (1–10). Return up to k matching names, sorted by descending count and then ascending name. A name matches when it starts with prefix.",
    explanation: "Filter by prefix and sort the matches by negative count and name. For a single query this costs O(n × p + m log m) scalar comparisons for prefix length p and m matches, plus name comparison costs. For repeated queries, cache the best k entries per prefix in a trie.",
    cases: [
      {"name":"Rank a prefix","input":{"parts":[["bolt",9],["brake",12],["brush",12],["clip",15]],"prefix":"b","k":2},"expected":["brake","brush"]},
      {"name":"No matching prefix","input":{"parts":[["nut",4]],"prefix":"x","k":1},"expected":[]},
      {"name":"Tie at the cutoff","input":{"parts":[["axle",8],["arm",8],["arch",8]],"prefix":"a","k":2},"expected":["arch","arm"]},
      {"name":"Name is also a prefix","input":{"parts":[["bolt",3],["boltkit",8],["cap",9]],"prefix":"bolt","k":5},"expected":["boltkit","bolt"]},
      {"name":"Empty prefix and zero count","input":{"parts":[["pin",0],["kit",0]],"prefix":"","k":10},"expected":["kit","pin"]}
    ]
  },
  {
    id: "delta-baggage-handoffs",
    company: "Delta Air Lines",
    title: "Locate feasible baggage handoffs",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read arrival (an integer minute) and cutoffs (a sorted array of integer minutes). A cutoff is feasible at least 25 minutes after arrival. Return an object with first (first feasible cutoff or null) and candidates (all feasible cutoffs in original order, including duplicates).",
    explanation: "Binary-search for the first cutoff at or after arrival + 25. Copy the suffix and read its first value if present. For n cutoffs and m returned values the time is O(log n + m), with O(m) output space.",
    cases: [
      {"name":"Hub transfer","input":{"arrival":506,"cutoffs":[510,530,550,570]},"expected":{"first":550,"candidates":[550,570]}},
      {"name":"Exactly enough time","input":{"arrival":100,"cutoffs":[124,125,125,140]},"expected":{"first":125,"candidates":[125,125,140]}},
      {"name":"Every cutoff missed","input":{"arrival":100,"cutoffs":[101,124]},"expected":{"first":null,"candidates":[]}},
      {"name":"No departures","input":{"arrival":0,"cutoffs":[]},"expected":{"first":null,"candidates":[]}},
      {"name":"All departures qualify","input":{"arrival":20,"cutoffs":[45,89]},"expected":{"first":45,"candidates":[45,89]}}
    ]
  },
  {
    id: "delta-turnaround-gaps",
    company: "Delta Air Lines",
    title: "Find unused aircraft turnaround time",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read window [start,end] and unsorted tasks [[start,end],...], all integer half-open intervals. Clip tasks to the window. Return {idle:[[start,end],...],total:minutes} for uncovered intervals lasting at least four minutes, ordered by start. Include only reported intervals in total.",
    explanation: "Clip and sort the occupied intervals. Sweep a cursor tracking the farthest occupied end, emitting qualifying gaps before each task and after the last task. Sorting dominates at O(n log n) time and O(n) space.",
    cases: [
      {"name":"Overlapping crews","input":{"window":[0,50],"tasks":[[0,15],[10,30],[34,40],[45,50]]},"expected":{"idle":[[30,34],[40,45]],"total":9}},
      {"name":"Empty work list","input":{"window":[10,14],"tasks":[]},"expected":{"idle":[[10,14]],"total":4}},
      {"name":"Short window","input":{"window":[10,13],"tasks":[]},"expected":{"idle":[],"total":0}},
      {"name":"Clip and skip outside tasks","input":{"window":[3,23],"tasks":[[24,28],[18,30],[-1,5],[12,15],[10,12]]},"expected":{"idle":[[5,10]],"total":5}},
      {"name":"Nested work spans the window","input":{"window":[0,12],"tasks":[[5,7],[-5,14],[2,3]]},"expected":{"idle":[],"total":0}}
    ]
  },
  {
    id: "nvidia-buffer-align",
    company: "NVIDIA",
    title: "Place tensors in an aligned buffer",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an array of [size,alignment] pairs of positive integers. Place each request at the first multiple of its alignment at or beyond the previous end. Start at byte zero. Return {offsets:[...],bytes:end}. Alignment can be any positive integer.",
    explanation: "For each request, round the free pointer up to the next multiple using integer arithmetic, record the offset and advance by size. This takes O(n) time and O(1) auxiliary space beyond the returned offsets.",
    cases: [
      {"name":"Aligned tensors","input":[[3,4],[5,8],[2,4]],"expected":{"offsets":[0,8,16],"bytes":18}},
      {"name":"No requests","input":[],"expected":{"offsets":[],"bytes":0}},
      {"name":"No padding","input":[[4,2],[4,4]],"expected":{"offsets":[0,4],"bytes":8}},
      {"name":"Non-power-of-two alignment","input":[[2,1],[2,3],[1,6]],"expected":{"offsets":[0,3,6],"bytes":7}},
      {"name":"Do not backfill gaps","input":[[1,1],[1,8],[1,1]],"expected":{"offsets":[0,8,9],"bytes":10}}
    ]
  },
  {
    id: "anthropic-row-norms",
    company: "Anthropic",
    title: "Accelerate a quantized embedding reduction",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an array of rows. Each row contains exactly 128 integer values between −128 and 127 inclusive. Return the squared L2 norm of each row as an integer in the same row order. This check grades the exact numerical baseline.",
    explanation: "Accumulate each row’s squared elements into an integer total, visiting contiguous elements together. The maximum is 128 × 128² = 2,097,152. Widen before multiplying in a fixed-width implementation. Time is O(128n) for n rows and auxiliary space is O(1).",
    cases: [
      {"name":"Opposite signed extremes","input":[[-128,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"expected":[32513]},
      {"name":"Empty batch","input":[],"expected":[]},
      {"name":"All zero","input":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"expected":[0]},
      {"name":"Maximum row norm","input":[[-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128,-128]],"expected":[2097152]},
      {"name":"Preserve row order","input":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[-1,2,-3,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"expected":[128,30]}
    ]
  },
  {
    id: "doordash-pickup-events",
    company: "DoorDash",
    title: "Reconcile curbside pickup events",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read events as [order ID, positive sequence, action] triples. Duplicates agree. Apply contiguous sequences from 1. Allowed paths are CREATED → READY → COLLECTED or CREATED → CANCELLED. Stop before the first gap or invalid transition. Return [id,state,lastApplied,invalidSequence] per seen order, sorted by ASCII ID. Use null for missing state or an unobserved invalid sequence.",
    explanation: "Group by order and sequence, then walk contiguous positions against a transition table, stopping before an invalid event and reporting its sequence. Grouping and replay take O(n) expected time, plus O(k log k) for sorting k order IDs; storage is O(n).",
    cases: [
      {"name":"Duplicate and invalid event","input":[["A",2,"READY"],["A",1,"CREATED"],["A",2,"READY"],["A",3,"CANCELLED"]],"expected":[["A","READY",2,3]]},
      {"name":"Gap before a later event","input":[["X",3,"COLLECTED"],["X",1,"CREATED"]],"expected":[["X","CREATED",1,null]]},
      {"name":"Independent orders","input":[["B",2,"CANCELLED"],["A",3,"COLLECTED"],["B",1,"CREATED"],["A",1,"CREATED"],["A",2,"READY"]],"expected":[["A","COLLECTED",3,null],["B","CANCELLED",2,null]]},
      {"name":"Missing and invalid starts","input":[["A",1,"READY"],["B",2,"READY"]],"expected":[["A",null,0,1],["B",null,0,null]]},
      {"name":"Empty queue","input":[],"expected":[]}
    ]
  },
  {
    id: "apple-haptic-search",
    company: "Apple",
    title: "Find a haptic pattern in a stream",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read stream and pattern, both integer arrays. Return every zero-based start index where the complete nonempty pattern appears, in increasing order. Matches may overlap.",
    explanation: "Build the pattern’s prefix table, then scan the input with the Knuth–Morris–Pratt algorithm. After a match, fall back to its longest proper matching prefix so overlaps survive. Time is O(n + m), with O(m) auxiliary space for a pattern of length m.",
    cases: [
      {"name":"Overlapping pattern","input":{"stream":[1,2,1,2,1],"pattern":[1,2,1]},"expected":[0,2]},
      {"name":"Repeated amplitude","input":{"stream":[0,0,0],"pattern":[0,0]},"expected":[0,1]},
      {"name":"Pattern longer than stream","input":{"stream":[1],"pattern":[1,2]},"expected":[]},
      {"name":"Distinct positions","input":{"stream":[-2,0,-2],"pattern":[-2]},"expected":[0,2]},
      {"name":"Empty stream","input":{"stream":[],"pattern":[4]},"expected":[]}
    ]
  },
  {
    id: "cisco-maintenance-windows",
    company: "Cisco",
    title: "Collapse overlapping maintenance windows",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an unsorted array of integer half-open [start,end] pairs with start < end. Merge overlapping or touching intervals. Return {windows:[[start,end],...],total:minutes}, ordered by start.",
    explanation: "Sort by start and extend the current interval whenever the next start is at or before its end. Sum the lengths of merged intervals. Time is O(n log n) and space is O(n) including the sorted copy and result.",
    cases: [
      {"name":"Planned network outages","input":[[5,12],[10,15],[15,20],[25,28]],"expected":{"windows":[[5,20],[25,28]],"total":18}},
      {"name":"No outages","input":[],"expected":{"windows":[],"total":0}},
      {"name":"Nested windows","input":[[4,7],[1,12],[3,9]],"expected":{"windows":[[1,12]],"total":11}},
      {"name":"Unsorted and touching","input":[[6,8],[2,3],[3,6]],"expected":{"windows":[[2,8]],"total":6}},
      {"name":"Disjoint with duplicate","input":[[2,5],[-2,-1],[2,5]],"expected":{"windows":[[-2,-1],[2,5]],"total":4}}
    ]
  },
  {
    id: "disney-cue-order",
    company: "Disney",
    title: "Sequence a parade playlist",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read cues (distinct uppercase ASCII names) and dependencies (unique [before,after] pairs using those names). Return the lexicographically first complete valid sequence. Return null if a cycle prevents completion.",
    explanation: "Maintain each cue’s indegree and a min-heap of ready cues. Always emit the smallest available cue, then release its dependents. A partial result exposes a cycle. This takes O(e + n log n) time and O(e + n) space.",
    cases: [
      {"name":"Convergent dependencies","input":{"cues":["A","B","C"],"dependencies":[["A","C"],["B","C"]]},"expected":["A","B","C"]},
      {"name":"Cycle in separate component","input":{"cues":["A","B","C"],"dependencies":[["B","C"],["C","B"]]},"expected":null},
      {"name":"New cue outranks ready one","input":{"cues":["D","B","A"],"dependencies":[["B","A"]]},"expected":["B","A","D"]},
      {"name":"No cues","input":{"cues":[],"dependencies":[]},"expected":[]},
      {"name":"Only independent cues","input":{"cues":["X","A","M"],"dependencies":[]},"expected":["A","M","X"]}
    ]
  },
  {
    id: "databricks-partitions",
    company: "Databricks",
    title: "Choose partition split points",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read weights (a nonempty array of nonnegative integer key weights in sorted key order) and k, from 1 to the key count. Return the minimum possible largest sum among exactly k nonempty contiguous partitions.",
    explanation: "Binary-search a capacity between max(weights) and sum(weights). A greedy pass counts how many partitions that capacity requires. Nonnegative weights let you subdivide to reach exactly k groups. Time is O(n log(S + 2)) for total weight S; auxiliary space is O(1).",
    cases: [
      {"name":"Split key weights","input":{"weights":[2,5,2,3],"k":2},"expected":7},
      {"name":"One partition","input":{"weights":[4,1,6],"k":1},"expected":11},
      {"name":"All individual keys","input":{"weights":[0,9,2],"k":3},"expected":9},
      {"name":"Only zero weights","input":{"weights":[0,0,0],"k":2},"expected":0},
      {"name":"Keep keys contiguous","input":{"weights":[8,1,1,8],"k":2},"expected":9}
    ]
  },
  {
    id: "openai-prefix-fragments",
    company: "OpenAI",
    title: "Reassemble out-of-order response fragments",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read fragments from one request as [zero-based offset, printable ASCII string] pairs. Overlapping characters always agree. Return the longest contiguous string starting at offset zero. Ignore any bytes beyond the first gap.",
    explanation: "Record bytes by absolute offset, then read sequential offsets from zero until the first missing one. Repeated and overlapping fragments overwrite identical bytes. Expected time is O(B) for B supplied bytes and space is O(u) for u distinct positions.",
    cases: [
      {"name":"Overlapping fragments","input":[[2,"cd"],[0,"ab"],[1,"bc"]],"expected":"abcd"},
      {"name":"Missing first byte","input":[[2,"xy"]],"expected":""},
      {"name":"Stop at the first gap","input":[[4,"ef"],[0,"abc"]],"expected":"abc"},
      {"name":"Duplicate and bridge","input":[[3,"de"],[0,"ab"],[0,"ab"],[2,"c"]],"expected":"abcde"},
      {"name":"Empty fragment","input":[[0,""]],"expected":""}
    ]
  },
  {
    id: "airbnb-discount",
    company: "Airbnb",
    title: "Allocate a stay's nightly discount",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read prices (nonnegative nightly prices in cents in date order, with positive sum) and discount (whole cents from zero through their sum). Allocate discount proportionally by price, floor each allocation, and give any remaining cents to nights with the largest fractional remainders, in date order for ties. Return one integer per night.",
    explanation: "Use the quotient and remainder of price × discount divided by total price. Sort indices by descending integer remainder, then by original position. This preserves the exact discount in O(n log n) time and O(n) space.",
    cases: [
      {"name":"Largest remainders","input":{"prices":[200,100,100],"discount":11},"expected":[5,3,3]},
      {"name":"Date breaks ties","input":{"prices":[10,10,10],"discount":2},"expected":[1,1,0]},
      {"name":"Zero-priced night","input":{"prices":[0,5,5],"discount":3},"expected":[0,2,1]},
      {"name":"No promotion","input":{"prices":[75],"discount":0},"expected":[0]},
      {"name":"Full discount","input":{"prices":[3,7,11],"discount":21},"expected":[3,7,11]}
    ]
  },
  {
    id: "point72-average-ranks",
    company: "Point72",
    title: "Compute stable ranks with ties",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "For one date, read an array of integer features or null. Rank observed values in ascending order starting at 1. Equal integers receive the mean rank of their group. Return ranks in original order, leaving null positions unchanged.",
    explanation: "Sort (value,index) pairs for nonmissing observations. Scan equal runs and write the mean of each run’s first and last one-based ranks to its original positions. Time is O(n log n) and space is O(n).",
    cases: [
      {"name":"Tied values","input":[3,1,3,null],"expected":[2.5,1,2.5,null]},
      {"name":"Missing records","input":[null,null],"expected":[null,null]},
      {"name":"All tied","input":[-4,-4,-4],"expected":[2,2,2]},
      {"name":"Multiple tied groups","input":[8,-3,8,-3],"expected":[3.5,1.5,3.5,1.5]},
      {"name":"Empty date","input":[],"expected":[]}
    ]
  },
  {
    id: "snowflake-rle-range",
    company: "Snowflake",
    title: "Translate run-length column positions",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read runs ([string,positive count] pairs), value, and integer bounds lo and hi within the decoded length. Count occurrences of value at zero-based positions lo ≤ index < hi. Runs may be large.",
    explanation: "Keep a running start position for each encoded run. Intersect matching runs with the query interval and add the length of each intersection. This requires O(r) time for r runs and O(1) auxiliary space, independently of decoded size.",
    cases: [
      {"name":"Partial runs","input":{"runs":[["x",3],["y",2],["x",1]],"value":"x","lo":2,"hi":6},"expected":2},
      {"name":"Empty range","input":{"runs":[["x",1]],"value":"x","lo":1,"hi":1},"expected":0},
      {"name":"Large run","input":{"runs":[["z",1000000000]],"value":"z","lo":99,"hi":1000000000},"expected":999999901},
      {"name":"Absent value","input":{"runs":[["y",9]],"value":"x","lo":0,"hi":9},"expected":0},
      {"name":"Two adjacent matching runs","input":{"runs":[["x",3],["x",2]],"value":"x","lo":1,"hi":4},"expected":3}
    ]
  },
  {
    id: "netflix-download-bundle",
    company: "Netflix",
    title: "Find the cheapest download bundle",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read need (nonnegative whole minutes) and files ([positive duration,positive size] pairs). Each file may be chosen once. Return the minimum total size that reaches at least need minutes, or null if impossible.",
    explanation: "Use a 0/1 knapsack table indexed by duration capped at need. Update backwards so one file cannot count twice, and retain the least size for each duration. Time is O(n × need) and space is O(need).",
    cases: [
      {"name":"Smallest usable bundle","input":{"need":12,"files":[[8,15],[7,10],[5,6]]},"expected":16},
      {"name":"No minutes required","input":{"need":0,"files":[]},"expected":0},
      {"name":"Cannot reuse a file","input":{"need":10,"files":[[6,2]]},"expected":null},
      {"name":"Overshoot is useful","input":{"need":5,"files":[[6,3],[5,9]]},"expected":3},
      {"name":"Duplicate files are distinct","input":{"need":6,"files":[[3,2],[3,2]]},"expected":4}
    ]
  },
  {
    id: "optiver-inventory-paths",
    company: "Optiver",
    title: "Find all feasible inventory paths",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read integers rounds (0–30) and limit (0–30). Start at zero, change by +1 or −1 every round, and remain in [−limit,limit] including endpoints. Return the number of valid paths ending at zero.",
    explanation: "Keep one count per reachable inventory. For each round, distribute the counts to the two neighbors still inside the bounds. Start with one empty path at zero. Time is O(rounds × (limit + 1)) and space is O(limit + 1).",
    cases: [
      {"name":"Narrow band","input":{"rounds":4,"limit":1},"expected":4},
      {"name":"Only empty path","input":{"rounds":0,"limit":0},"expected":1},
      {"name":"Zero width with movement","input":{"rounds":2,"limit":0},"expected":0},
      {"name":"Odd number of rounds","input":{"rounds":5,"limit":10},"expected":0},
      {"name":"Wider band","input":{"rounds":4,"limit":2},"expected":6}
    ]
  },
  {
    id: "amazon-fulfillment-cost",
    company: "Amazon",
    title: "Calculate fulfillment cost by cohort",
    category: "Other",
    languages: ["sql"],
    contract: "Return [promised_day, mean_total_cost_cents] rows sorted by day. orders has one row per delivered parcel. Sum every visit per parcel, treating a parcel with no visits as zero. Average across delivered parcels within each day. Each visit row is a distinct charge.",
    explanation: "Aggregate visits by parcel, then left join those totals to the orders table. Replace missing totals with zero before taking the daily average; averaging raw visits would weight multi-stop parcels more heavily.",
    cases: [
      {"name":"Unequal numbers of stops","input":{"orders":[["p1","Mon"],["p2","Mon"],["p3","Tue"]],"visits":[["p1","A",40],["p1","B",60],["p3","A",30]]},"expected":[["Mon",50],["Tue",30]]},
      {"name":"A cohort with no visits","input":{"orders":[["p1","Fri"]],"visits":[]},"expected":[["Fri",0]]},
      {"name":"Distinct charges at one center","input":{"orders":[["p1","Mon"],["p2","Mon"]],"visits":[["p1","A",5],["p1","A",5],["p2","A",1]]},"expected":[["Mon",5.5]]},
      {"name":"Empty cohort","input":{"orders":[],"visits":[]},"expected":[]},
      {"name":"Sort the days","input":{"orders":[["p1","2026-06-02"],["p2","2026-06-01"]],"visits":[["p1","A",12]]},"expected":[["2026-06-01",0],["2026-06-02",12]]}
    ],
    tables: [{"name":"orders","columns":[{"name":"parcel","type":"TEXT"},{"name":"promised_day","type":"TEXT"}]},{"name":"visits","columns":[{"name":"parcel","type":"TEXT"},{"name":"center","type":"TEXT"},{"name":"cost_cents","type":"INTEGER"}]}],
    fixture: "orders(parcel TEXT, promised_day TEXT); visits(parcel TEXT, center TEXT, cost_cents INTEGER)"
  },
  {
    id: "databricks-dashboard-join",
    company: "Databricks",
    title: "Detect a misleading dashboard join",
    category: "Other",
    languages: ["sql"],
    contract: "For every user/day with one or more sessions return [user_id, day, session_count, purchase_count]. Session and purchase IDs are unique in their own tables. Include zero purchases. Sort by user_id, then day. Exclude purchase-only user/day pairs.",
    explanation: "Count each table independently at the (user_id,day) grain. Left join the grouped counts from sessions to purchases on both keys and substitute zero for missing purchase counts. This avoids multiplying event rows.",
    cases: [
      {"name":"Join fan-out","input":{"sessions":[["s1","A","Mon"],["s2","A","Mon"]],"purchases":[["p1","A","Mon"],["p2","A","Mon"],["p3","A","Mon"]]},"expected":[["A","Mon",2,3]]},
      {"name":"Do not mix days","input":{"sessions":[["s2","A","Tue"],["s1","A","Mon"]],"purchases":[["p1","A","Tue"]]},"expected":[["A","Mon",1,0],["A","Tue",1,1]]},
      {"name":"Exclude purchase-only users","input":{"sessions":[["s1","B","Mon"]],"purchases":[["p1","A","Mon"]]},"expected":[["B","Mon",1,0]]},
      {"name":"No activity","input":{"sessions":[],"purchases":[]},"expected":[]},
      {"name":"Separate users on the same day","input":{"sessions":[["s1","B","Fri"],["s2","A","Fri"]],"purchases":[["p1","B","Fri"]]},"expected":[["A","Fri",1,0],["B","Fri",1,1]]}
    ],
    tables: [{"name":"sessions","columns":[{"name":"session_id","type":"TEXT"},{"name":"user_id","type":"TEXT"},{"name":"day","type":"TEXT"}]},{"name":"purchases","columns":[{"name":"purchase_id","type":"TEXT"},{"name":"user_id","type":"TEXT"},{"name":"day","type":"TEXT"}]}],
    fixture: "sessions(session_id TEXT, user_id TEXT, day TEXT); purchases(purchase_id TEXT, user_id TEXT, day TEXT)"
  },
  {
    id: "intuit-unbalanced-ledger",
    company: "Intuit",
    title: "Find unbalanced journal entries",
    category: "Coding",
    languages: ["sql"],
    contract: "Return [entry_id, debit_minus_credit] for each entry with unequal totals, sorted by entry_id. Each postings row is a distinct posting, including identical rows. side is debit or credit and cents is a nonnegative integer.",
    explanation: "Turn each debit into positive cents and each credit into negative cents. Group by entry_id, sum the signed amounts, and filter out zero-sum groups using HAVING.",
    cases: [
      {"name":"One cent short","input":{"postings":[["X","debit",80],["X","credit",50],["X","credit",29]]},"expected":[["X",1]]},
      {"name":"Balanced including zero","input":{"postings":[["A","debit",11],["A","credit",11],["B","debit",0]]},"expected":[]},
      {"name":"Credit-only and debit-only","input":{"postings":[["Z","debit",7],["A","credit",5]]},"expected":[["A",-5],["Z",7]]},
      {"name":"Repeated posting and quoted identifier","input":{"postings":[["Sam's","debit",9],["Sam's","debit",9],["Sam's","credit",1]]},"expected":[["Sam's",17]]},
      {"name":"Empty ledger","input":{"postings":[]},"expected":[]}
    ],
    tables: [{"name":"postings","columns":[{"name":"entry_id","type":"TEXT"},{"name":"side","type":"TEXT"},{"name":"cents","type":"INTEGER"}]}],
    fixture: "postings(entry_id TEXT, side TEXT, cents INTEGER)"
  },
  {
    id: "goldman-daily-postings",
    company: "Goldman Sachs",
    title: "Aggregate signed decimal postings",
    category: "Coding",
    languages: ["sql"],
    contract: "Return [business_day,currency,net_minor] for each observed day/currency pair, including net zero. Sum signed integer minor units without mixing currencies or dates. Sort by day, then currency.",
    explanation: "Group by the two dimensions and sum signed integer amounts. Treat reversals as ordinary negative postings and retain groups that net to zero.",
    cases: [
      {"name":"Two currencies","input":{"postings":[["2026-04-09","EUR",100],["2026-04-09","EUR",-30],["2026-04-09","USD",10]]},"expected":[["2026-04-09","EUR",70],["2026-04-09","USD",10]]},
      {"name":"Complete reversal","input":{"postings":[["d1","USD",70],["d1","USD",-70]]},"expected":[["d1","USD",0]]},
      {"name":"Dates sort before currencies","input":{"postings":[["d2","AUD",20],["d1","USD",5],["d1","CAD",4]]},"expected":[["d1","CAD",4],["d1","USD",5],["d2","AUD",20]]},
      {"name":"Duplicate and negative postings","input":{"postings":[["d1","CAD",-14],["d1","CAD",-14]]},"expected":[["d1","CAD",-28]]},
      {"name":"No postings","input":{"postings":[]},"expected":[]}
    ],
    tables: [{"name":"postings","columns":[{"name":"business_day","type":"TEXT"},{"name":"currency","type":"TEXT"},{"name":"amount_minor","type":"INTEGER"}]}],
    fixture: "postings(business_day TEXT, currency TEXT, amount_minor INTEGER)"
  },
  {
    id: "ibm-last-job-attempt",
    company: "IBM",
    title: "Reconstruct batch job attempts",
    category: "Coding",
    languages: ["sql"],
    contract: "Return [job,attempt,state] for each job with a terminal attempt, sorted by job. States are started, failed, and succeeded. Choose the highest numbered attempt with a terminal record. Identical terminal rows are duplicates; each attempt has at most one distinct terminal state.",
    explanation: "Filter to terminal states and remove duplicate terminal records. Use a descending row number within each job and retain row one, or join to the maximum terminal attempt per job.",
    cases: [
      {"name":"A higher attempt is running","input":{"job_log":[["J",1,"failed"],["J",2,"succeeded"],["J",2,"succeeded"],["J",3,"started"]]},"expected":[["J",2,"succeeded"]]},
      {"name":"Ignore jobs that never finish","input":{"job_log":[["A",1,"started"],["B",1,"failed"]]},"expected":[["B",1,"failed"]]},
      {"name":"A retry fails after success","input":{"job_log":[["X",4,"failed"],["X",1,"succeeded"],["X",4,"started"]]},"expected":[["X",4,"failed"]]},
      {"name":"Sort independent jobs","input":{"job_log":[["Z",1,"failed"],["A",2,"succeeded"],["Z",2,"succeeded"]]},"expected":[["A",2,"succeeded"],["Z",2,"succeeded"]]},
      {"name":"No job records","input":{"job_log":[]},"expected":[]}
    ],
    tables: [{"name":"job_log","columns":[{"name":"job","type":"TEXT"},{"name":"attempt","type":"INTEGER"},{"name":"state","type":"TEXT"}]}],
    fixture: "job_log(job TEXT, attempt INTEGER, state TEXT)"
  },
  {
    id: "google-log-spans",
    company: "Google",
    title: "Count balanced spans within log segments",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {segments, target}. Each segment is an array of signed integers. Return the count of nonempty contiguous spans wholly inside one segment whose sum equals target. Segments may be empty. All sums and counts fit in a JavaScript safe integer.",
    explanation: "Begin each segment with one empty prefix of sum zero. At each event add the number of earlier prefixes equal to the new prefix minus the target, then record the new prefix. This uses expected linear time in the input size and space bounded by the longest segment.",
    cases: [
      {"name":"Restarts and zero readings","input":{"segments":[[2,-2,2],[0,0],[]],"target":0},"expected":5},
      {"name":"No cross-restart span","input":{"segments":[[2],[3]],"target":5},"expected":0},
      {"name":"Negative target","input":{"segments":[[-2,1,-1]],"target":-2},"expected":2},
      {"name":"No segments","input":{"segments":[],"target":0},"expected":0},
      {"name":"Repeated nonzero target","input":{"segments":[[1,0,1],[1]],"target":1},"expected":5}
    ]
  },
  {
    id: "meta-notification-holdout",
    company: "Meta",
    title: "Measure a notification holdout by assigned account",
    category: "Other",
    languages: ["sql"],
    contract: "Use SQLite to return [arm, assigned_count, contacted_count] for each observed arm in ascending arm order. Each account has one assignment. An account qualifies if it has one or more contact events. Ignore events for unassigned accounts. Count accounts with no events in assigned_count.",
    explanation: "Reduce contacts to distinct account IDs, left-join those IDs to assignments and group by arm. Counting distinct qualifying accounts also works. Starting from assignments preserves zero-contact arms.",
    cases: [
      {"name":"Multiple contacts and unexposed accounts","input":{"assignment":[["a","T"],["b","T"],["c","T"],["d","C"],["e","C"],["f","C"],["g","C"]],"contact":[["a"],["a"],["b"],["e"]]},"expected":[["C",4,1],["T",3,2]]},
      {"name":"Unassigned contact","input":{"assignment":[["a","T"]],"contact":[["x"]]},"expected":[["T",1,0]]},
      {"name":"No events","input":{"assignment":[["a","T"],["b","C"]],"contact":[]},"expected":[["C",1,0],["T",1,0]]},
      {"name":"Empty roster","input":{"assignment":[],"contact":[["x"]]},"expected":[]},
      {"name":"One active arm","input":{"assignment":[["a","Z"],["b","Z"]],"contact":[["a"],["b"],["b"]]},"expected":[["Z",2,2]]}
    ],
    tables: [{"name":"assignment","columns":[{"name":"account","type":"TEXT"},{"name":"arm","type":"TEXT"}]},{"name":"contact","columns":[{"name":"account","type":"TEXT"}]}],
    fixture: "assignment(account TEXT, arm TEXT); contact(account TEXT)"
  },
  {
    id: "stripe-tiered-usage",
    company: "Stripe",
    title: "Price metered usage across allowance tiers",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an array of [merchant, units] batches for one month. Merchant IDs are uppercase ASCII letters. Units are nonnegative integers. For each merchant, the first 10 units are free, the next 10 cost 3 cents each, and later units cost 2 cents each. Return [merchant, cents] pairs sorted by merchant. Totals fit in a safe integer.",
    explanation: "Sum units per merchant, then price each nonoverlapping usage tier once. Sort merchant IDs for deterministic output. With b batches and m merchants the cost is O(b + m log m) time and O(m) auxiliary space.",
    cases: [
      {"name":"Batches cross tiers","input":[["A",9],["B",10],["A",7],["A",8]],"expected":[["A",38],["B",0]]},
      {"name":"Exact tier ends","input":[["B",20],["A",10]],"expected":[["A",0],["B",30]]},
      {"name":"First paid unit","input":[["C",11]],"expected":[["C",3]]},
      {"name":"Zero and upper tier","input":[["Z",0],["A",21]],"expected":[["A",32],["Z",0]]},
      {"name":"No merchants","input":[],"expected":[]}
    ]
  },
  {
    id: "uber-zone-revisions",
    company: "Uber",
    title: "Rank zones after late pickup corrections",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {snapshots, k}. Each snapshot is [uppercase ASCII zone ID, positive integer revision, nonnegative pickup count]. Equal revisions for a zone have identical counts. Rank zones by the count at their highest revision, descending, then by ID ascending. Return up to k IDs, where k is nonnegative.",
    explanation: "Retain the newest revision and its count for every zone. Sort by descending count then ascending ID and take the requested prefix. For n snapshots and z zones this costs O(n + z log z) time.",
    cases: [
      {"name":"Late correction and tied leaders","input":{"snapshots":[["A",2,1],["B",1,4],["A",1,9],["C",3,4]],"k":2},"expected":["B","C"]},
      {"name":"Higher revision lowers a count","input":{"snapshots":[["X",1,100],["Y",3,6],["X",2,0]],"k":4},"expected":["Y","X"]},
      {"name":"Identical replay","input":{"snapshots":[["A",1,5],["A",1,5]],"k":2},"expected":["A"]},
      {"name":"No selections","input":{"snapshots":[["Z",5,5]],"k":0},"expected":[]},
      {"name":"No zones","input":{"snapshots":[],"k":3},"expected":[]}
    ]
  },
  {
    id: "c3-sustained-modes",
    company: "C3 AI",
    title: "Detect sustained operating modes",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {samples, end, minimum}. Samples are [minute, state] pairs in strictly increasing minute order. Each state holds until the next timestamp or end. Return [state, start, stop] for maximal contiguous runs lasting at least minimum minutes, in time order. minimum is positive and end is later than the last sample.",
    explanation: "Extend a run while the state matches. When the state changes or the data ends, measure the whole run once and keep it if the duration reaches the threshold. The scan takes O(n) time.",
    cases: [
      {"name":"Repeated states extend one run","input":{"samples":[[0,"A"],[2,"A"],[6,"B"],[9,"A"]],"end":12,"minimum":5},"expected":[["A",0,6]]},
      {"name":"Exact threshold","input":{"samples":[[4,"B"]],"end":9,"minimum":5},"expected":[["B",4,9]]},
      {"name":"State returns later","input":{"samples":[[0,"A"],[3,"B"],[4,"A"]],"end":8,"minimum":3},"expected":[["A",0,3],["A",4,8]]},
      {"name":"Empty log","input":{"samples":[],"end":10,"minimum":1},"expected":[]},
      {"name":"None long enough","input":{"samples":[[1,"X"],[2,"Y"]],"end":3,"minimum":2},"expected":[]}
    ]
  },
  {
    id: "jump-weighted-selection",
    company: "Jump Trading",
    title: "Track a weighted sampling window",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {weights, operations}. An update is [\"set\", index, value] with a valid zero-based index and nonnegative integer value. A query is [\"pick\", k] with a nonnegative integer k. Return the first index whose inclusive prefix sum exceeds k, or null if it does not exist. Return a list of query results only. Integers and prefix sums are safe.",
    explanation: "A linear scan after each query is a reference implementation. For interleaved updates and queries use a Fenwick tree and cumulative-frequency search, with O(log n) time per operation after construction.",
    cases: [
      {"name":"Skip zero weight after an update","input":{"weights":[2,0,3],"operations":[["pick",2],["set",0,0],["pick",0],["pick",3]]},"expected":[2,2,null]},
      {"name":"Strict upper boundary","input":{"weights":[1,2],"operations":[["pick",0],["pick",1],["pick",2],["pick",3]]},"expected":[0,1,1,null]},
      {"name":"Empty population","input":{"weights":[],"operations":[["pick",0]]},"expected":[null]},
      {"name":"Updates alone","input":{"weights":[0],"operations":[["set",0,4]]},"expected":[]},
      {"name":"Revive a zero population","input":{"weights":[0,0],"operations":[["pick",0],["set",1,1],["pick",0]]},"expected":[null,1]}
    ]
  },
  {
    id: "waymo-trace-turns",
    company: "Waymo",
    title: "Simplify a recorded route polyline",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read integer [x,y] vertices in trace order. First drop consecutive duplicate points. Drop an interior point when the incoming and outgoing steps are collinear and point in the same direction. Retain both endpoints of every nonempty deduplicated trace (a singleton appears once). Return retained coordinates in order. Absolute coordinates are at most 10,000.",
    explanation: "Compare successive step directions using an integer cross product and dot product. A zero cross product with positive dot product permits dropping a straight-through point. A negative dot product is a reversal. Each point is examined a constant number of times.",
    cases: [
      {"name":"Turn after straight travel","input":[[0,0],[1,0],[2,0],[2,1]],"expected":[[0,0],[2,0],[2,1]]},
      {"name":"Preserve reversal","input":[[0,0],[1,1],[2,2],[0,0]],"expected":[[0,0],[2,2],[0,0]]},
      {"name":"Repeated singleton","input":[[3,-1],[3,-1]],"expected":[[3,-1]]},
      {"name":"Empty trace","input":[],"expected":[]},
      {"name":"Duplicates around a turn","input":[[-2,0],[-2,0],[-1,1],[0,2],[0,2],[1,1]],"expected":[[-2,0],[0,2],[1,1]]}
    ]
  },
  {
    id: "karat-branching-score",
    company: "Karat",
    title: "Score a branching practice session",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read a nonempty tree as an array of [parent, points, possible] nodes. Node 0 has parent -1. Each other parent index is smaller than its node index. Scores are integers with 0 ≤ points ≤ possible, possible > 0. Return the root-to-leaf node-index path with the highest sum(points)/sum(possible). Ties go to the smaller leaf index. Cross products fit in safe integers.",
    explanation: "Accumulate the earned and possible totals from each parent. Mark nodes with children and compare fractions only at leaves using cross multiplication. Follow parents from the winning leaf and reverse. Time and space are O(n).",
    cases: [
      {"name":"Deeper path with a better fraction","input":[[-1,0,2],[0,3,6],[0,1,1],[2,2,2]],"expected":[0,2,3]},
      {"name":"Leaf tie by index","input":[[-1,1,1],[0,0,1],[0,1,3]],"expected":[0,1]},
      {"name":"Root is the sole leaf","input":[[-1,0,5]],"expected":[0]},
      {"name":"High internal score is ineligible","input":[[-1,3,3],[0,0,8],[1,0,5]],"expected":[0,1,2]},
      {"name":"Total points alone misleads","input":[[-1,0,1],[0,10,20],[0,2,2]],"expected":[0,2]}
    ]
  },
  {
    id: "adobe-reviewer-ranges",
    company: "Adobe",
    title: "Count the reviewers on each passage",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read highlights as [reviewer, start, end] triples in any order. Reviewer names are strings and offsets are nonnegative integers with start ≤ end. Return maximal covered half-open intervals as [start, end, distinct reviewer count], in increasing order. Merge neighboring intervals with the same count even if the active reviewers change. Ignore empty highlights.",
    explanation: "Sweep the sorted endpoints. Apply all changes at one coordinate together and track how many marks each reviewer currently has. A reviewer contributes one while their mark count is positive. Merge adjacent output segments with equal counts.",
    cases: [
      {"name":"Overlapping marks by one reviewer","input":[["Ana",0,4],["Ana",2,5],["Bo",3,6]],"expected":[[0,3,1],[3,5,2],[5,6,1]]},
      {"name":"Reviewers change at a shared endpoint","input":[["Bea",3,7],["Ada",0,3]],"expected":[[0,7,1]]},
      {"name":"A gap separates equal counts","input":[["A",0,2],["B",4,6],["B",6,6]],"expected":[[0,2,1],[4,6,1]]},
      {"name":"Duplicate and nested marks","input":[["B",2,3],["A",0,5],["A",0,5],["C",2,3]],"expected":[[0,2,1],[2,3,3],[3,5,1]]},
      {"name":"Empty highlights","input":[],"expected":[]}
    ]
  },
  {
    id: "anduril-gauge-validity",
    company: "Anduril",
    title: "Match inspections to a calibration interval",
    category: "Coding",
    languages: ["sql"],
    contract: "Use SQLite to find which office-cart inspections require a recheck. A gauge is valid at minutes start_minute ≤ minute < end_minute in any of its calibration rows. An unrecognized gauge has no valid minutes. Return [inspection_id, gauge, minute] for each uncovered inspection, ordered by its unique integer inspection_id. Validity intervals may overlap or touch.",
    explanation: "Correlate each inspection with calibration records for its own gauge. Keep the inspection when no containing interval exists. Comparing the lower bound inclusively and the upper bound exclusively handles both exact endpoints.",
    cases: [
      {"name":"Calibration boundaries","input":{"inspections":[[1,"G",2],[2,"G",5],[3,"G",6],[4,"G",8],[5,"G",10],[6,"G",12]],"calibrations":[["G",2,6],["G",9,12]]},"expected":[[3,"G",6],[4,"G",8],[6,"G",12]]},
      {"name":"Adjacent coverage","input":{"inspections":[[2,"Q",5],[1,"Q",7]],"calibrations":[["Q",1,5],["Q",5,7]]},"expected":[[1,"Q",7]]},
      {"name":"Unknown gauge","input":{"inspections":[[9,"Y",10],[4,"X",10]],"calibrations":[["X",9,12]]},"expected":[[9,"Y",10]]},
      {"name":"Overlapping intervals","input":{"inspections":[[13,"A",4],[11,"A",9],[12,"A",6]],"calibrations":[["A",1,7],["A",4,9]]},"expected":[[11,"A",9]]},
      {"name":"No stored calibrations","input":{"inspections":[[8,"R",0],[3,"S",4]],"calibrations":[]},"expected":[[3,"S",4],[8,"R",0]]}
    ],
    tables: [{"name":"inspections","columns":[{"name":"inspection_id","type":"INTEGER"},{"name":"gauge","type":"TEXT"},{"name":"minute","type":"INTEGER"}]},{"name":"calibrations","columns":[{"name":"gauge","type":"TEXT"},{"name":"start_minute","type":"INTEGER"},{"name":"end_minute","type":"INTEGER"}]}],
    fixture: "inspections(inspection_id INTEGER, gauge TEXT, minute INTEGER); calibrations(gauge TEXT, start_minute INTEGER, end_minute INTEGER)"
  },
  {
    id: "atlassian-retry-deadlines",
    company: "Atlassian",
    title: "Schedule retries under two cooldowns",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {now, siteUntil, cooldowns, pending}. All times are nonnegative integer seconds. siteUntil is a list of site-wide deadlines; cooldowns contains [endpoint, deadline] pairs, possibly repeated. For each pending endpoint string, in input order, return the earliest permitted integer time. A request can run at the deadline. Every applicable deadline and now are lower bounds. Planning a read creates no new cooldown.",
    explanation: "Take the maximum of now and all site deadlines, then keep the greatest reported deadline for each endpoint. Each output is the larger of the shared and endpoint deadlines. Duplicate pending requests keep their positions.",
    cases: [
      {"name":"Overlapping scopes","input":{"now":7,"siteUntil":[12],"cooldowns":[["A",16]],"pending":["A","B"]},"expected":[16,12]},
      {"name":"Expired and exact deadlines","input":{"now":12,"siteUntil":[9,12],"cooldowns":[["X",3],["Y",12]],"pending":["Y","X"]},"expected":[12,12]},
      {"name":"Older updates arrive late","input":{"now":0,"siteUntil":[8,4],"cooldowns":[["A",13],["A",7],["B",10]],"pending":["B","A","B","C"]},"expected":[10,13,10,8]},
      {"name":"No restrictions","input":{"now":0,"siteUntil":[],"cooldowns":[],"pending":["lookup"]},"expected":[0]},
      {"name":"Nothing pending","input":{"now":3,"siteUntil":[8],"cooldowns":[["A",6]],"pending":[]},"expected":[]}
    ]
  },
  {
    id: "bloomberg-confirmed-offset",
    company: "Bloomberg",
    title: "Advance a consumer's confirmed offset",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an array of positive integer message IDs in completion order. After each completion return the largest m such that all IDs from 1 through m have completed. The initial confirmed offset is 0. Repeated notifications are valid and cause no new completion. Return one offset per input.",
    explanation: "Remember completed IDs above the confirmed prefix. Advance the offset while the next integer is present, removing each consumed ID. Discard notifications at or below the offset. Every distinct ID is inserted and removed at most once.",
    cases: [
      {"name":"Out-of-order and repeated","input":[2,1,4,4,3],"expected":[0,2,2,2,4]},
      {"name":"Gap stays open","input":[5,3,4,2],"expected":[0,0,0,0]},
      {"name":"Replay a confirmed message","input":[1,1,2,1,3],"expected":[1,1,2,2,3]},
      {"name":"One completion releases a backlog","input":[7,5,6,1,3,4,2],"expected":[0,0,0,1,1,1,7]},
      {"name":"No completions","input":[],"expected":[]}
    ]
  },
  {
    id: "tiktok-common-visibility",
    company: "ByteDance / TikTok",
    title: "Validate export settings for multiple creators",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an array of per-account lists of case-sensitive visibility strings. Return the choices supported by every account, each once, in first-appearance order in the first account. Return an empty array when no accounts are supplied or when any account has no choices.",
    explanation: "Deduplicate the first account’s list while preserving its order. Convert the remaining lists to sets for membership checks, then retain only choices in every set.",
    cases: [
      {"name":"Options from three creators","input":[["private","friends","public"],["private","friends"],["private","public"]],"expected":["private"]},
      {"name":"First account controls order","input":[["z","a","m"],["m","z","a"]],"expected":["z","a","m"]},
      {"name":"Remove repeats for a single account","input":[["public","friends","public","friends"]],"expected":["public","friends"]},
      {"name":"An empty account blocks every choice","input":[["Public","public"],[]],"expected":[]},
      {"name":"No accounts","input":[],"expected":[]}
    ]
  },
  {
    id: "capital-one-statement-corrections",
    company: "Capital One",
    title: "Choose nonoverlapping statement corrections",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read unsorted [start, end, reimbursement] triples. A correction occupies the half-open range [start, end) with integer start < end. Reimbursements are signed integers. Return the maximum total reimbursement from a subset with no overlapping ranges; choosing none yields zero. The result fits in a safe integer.",
    explanation: "Sort corrections by end day. For each correction, binary-search the last end no greater than its start. Compare skipping the correction with taking it alongside the optimal compatible prefix. The initial optimum of zero permits rejecting every negative offer.",
    cases: [
      {"name":"Two corrections beat one","input":[[1,3,5],[2,4,7],[3,5,4]],"expected":9},
      {"name":"All values nonpositive","input":[[0,1,-5],[1,2,0],[0,2,-1]],"expected":0},
      {"name":"Unsorted touching intervals","input":[[5,8,4],[0,2,2],[2,5,6],[1,7,11]],"expected":12},
      {"name":"A long offer beats many small ones","input":[[0,3,3],[3,6,4],[0,6,10],[6,7,2]],"expected":12},
      {"name":"No offers","input":[],"expected":0}
    ]
  },
  {
    id: "citadel-quoted-spreads",
    company: "Citadel / Citadel Securities",
    title: "Measure time at each quoted spread",
    category: "Coding",
    languages: ["sql"],
    contract: "Use SQLite to summarize quotes from a single venue. Each [minute, seq, bid, ask] becomes effective at minute until the next quote or the sole end_minute. At a shared minute the highest seq takes effect. All quotes arrive at or before end_minute, have unique (minute, seq), and use integer prices with ask ≥ bid. For each spread with positive duration, return [spread, total_minutes, overall_time_weighted_mean_spread] in increasing spread order. Round the overall mean to six decimal places. Exclude time before the first quote. Return no rows if no time was covered.",
    explanation: "Order updates by minute and sequence and use LEAD to find the end of each quote. Earlier updates at a shared minute have zero duration. Sum durations by spread, then divide total spread-minutes by total covered minutes using real arithmetic.",
    cases: [
      {"name":"Three quoted spreads","input":{"quotes":[[0,1,99,101],[3,2,100,101],[8,3,100,103]],"session_end":[[10]]},"expected":[[1,5,1.7],[2,3,1.7],[3,2,1.7]]},
      {"name":"Latest sequence wins ties","input":{"quotes":[[3,4,21,25],[1,2,20,20],[1,1,20,29],[3,3,21,28]],"session_end":[[5]]},"expected":[[0,2,2.0],[4,2,2.0]]},
      {"name":"Combine disjoint periods of one spread","input":{"quotes":[[5,1,12,14],[7,1,12,13],[8,1,10,12]],"session_end":[[10]]},"expected":[[1,1,1.8],[2,4,1.8]]},
      {"name":"No positive duration","input":{"quotes":[[6,1,9,11]],"session_end":[[6]]},"expected":[]},
      {"name":"No opening quote","input":{"quotes":[],"session_end":[[12]]},"expected":[]}
    ],
    tables: [{"name":"quotes","columns":[{"name":"minute","type":"INTEGER"},{"name":"seq","type":"INTEGER"},{"name":"bid","type":"INTEGER"},{"name":"ask","type":"INTEGER"}]},{"name":"session_end","columns":[{"name":"end_minute","type":"INTEGER"}]}],
    fixture: "quotes(minute INTEGER, seq INTEGER, bid INTEGER, ask INTEGER); session_end(end_minute INTEGER)"
  },
  {
    id: "dropbox-file-request-names",
    company: "Dropbox",
    title: "Name incoming files without collisions",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {existing, incoming} with case-sensitive ASCII filenames. Assign each upload its original name if free. Otherwise insert \" (n)\" before the last extension using the smallest positive n giving a free name. A final dot separates an extension only if it is neither the first nor last character of the original name. For names with no extension append the suffix. Treat existing suffixes as literal text. Return assigned names in arrival order.",
    explanation: "Maintain a set of names already taken. Split the incoming name at the last eligible dot and probe suffix numbers in ascending order. Reserve every selected name immediately. A cached next suffix per base avoids restarting a long collision chain.",
    cases: [
      {"name":"Gaps in existing suffixes","input":{"existing":["plan.pdf","plan (2).pdf"],"incoming":["plan.pdf","plan.pdf","plan.pdf"]},"expected":["plan (1).pdf","plan (3).pdf","plan (4).pdf"]},
      {"name":"Dotfiles and extensionless names","input":{"existing":[".env","notes","tail."],"incoming":[".env","notes","tail."]},"expected":[".env (1)","notes (1)","tail. (1)"]},
      {"name":"Last of multiple extensions","input":{"existing":["map.tar.gz"],"incoming":["map.tar.gz","map.TAR.gz","map.tar.gz"]},"expected":["map.tar (1).gz","map.TAR.gz","map.tar (2).gz"]},
      {"name":"An assigned suffix can be requested literally","input":{"existing":[],"incoming":["x.txt","x.txt","x (1).txt","x.txt"]},"expected":["x.txt","x (1).txt","x (1) (1).txt","x (2).txt"]},
      {"name":"No uploads","input":{"existing":["report.txt"],"incoming":[]},"expected":[]}
    ]
  },
  {
    id: "jane-street-expression-graph",
    company: "Jane Street",
    title: "Evaluate an expression DAG once",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {root, nodes}. nodes maps letter-only case-sensitive IDs to [\"const\", integer], [\"add\", leftID, rightID], or [\"mul\", leftID, rightID]. Every referenced ID exists. Evaluate the root as an integer. Return null if a cycle is reachable from the root. Ignore disconnected nodes, including cycles. All intermediate results fit in a safe integer.",
    explanation: "Use a depth-first traversal of the root’s dependencies. A reference to an active ancestor signals a reachable cycle. Memoize finished nodes so a shared dependency or a repeated operand is computed once. Work is linear in the reachable nodes and edges.",
    cases: [
      {"name":"A shared subexpression feeds two parents","input":{"root":"R","nodes":{"R":["add","L","M"],"L":["add","P","A"],"M":["mul","P","B"],"P":["add","A","B"],"A":["const",2],"B":["const",3]}},"expected":22},
      {"name":"Reachable indirect cycle","input":{"root":"R","nodes":{"R":["add","A","B"],"A":["mul","C","B"],"C":["add","A","B"],"B":["const",1]}},"expected":null},
      {"name":"Unreachable cycle","input":{"root":"A","nodes":{"A":["const",-5],"B":["mul","B","A"]}},"expected":-5},
      {"name":"Reuse a zero-valued operand","input":{"root":"X","nodes":{"X":["add","Y","Y"],"Y":["mul","Z","K"],"Z":["const",0],"K":["const",-6]}},"expected":0},
      {"name":"Root refers to itself","input":{"root":"Self","nodes":{"Self":["mul","N","Self"],"N":["const",0]}},"expected":null}
    ]
  },
  {
    id: "jpmorgan-fee-allocation",
    company: "JPMorgan Chase",
    title: "Allocate a fee without losing cents",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {fee, accounts}, where fee is a nonnegative integer in cents and accounts contains [unique uppercase ASCII ID, nonnegative integer weight] pairs. Allocate each account its floored proportional share, then one extra cent per account in descending order of fractional remainder, breaking ties by ascending ID. Return [ID, cents] pairs in ID order including zero shares. If total weight is zero, return null. All intermediate integer products and totals fit within 1 billion.",
    explanation: "Use quotient and remainder of fee × weight divided by total weight. Every fractional share has the same denominator, so its integer remainder determines its rank exactly. Sort remainder ties by ID and give out the unassigned cents. The allocated sums equal the original fee.",
    cases: [
      {"name":"Ten cents among three accounts","input":{"fee":10,"accounts":[["C",1],["B",1],["A",1]]},"expected":[["A",4],["B",3],["C",3]]},
      {"name":"Fraction outranks account ID","input":{"fee":7,"accounts":[["A",2],["B",4],["C",5]]},"expected":[["A",1],["B",3],["C",3]]},
      {"name":"Include accounts with zero weight","input":{"fee":9,"accounts":[["Z",0],["M",2],["Q",1]]},"expected":[["M",6],["Q",3],["Z",0]]},
      {"name":"No amount to allocate","input":{"fee":0,"accounts":[["R",6],["F",2]]},"expected":[["F",0],["R",0]]},
      {"name":"Undefined proportion","input":{"fee":12,"accounts":[["A",0],["K",0]]},"expected":null}
    ]
  },
  {
    id: "linkedin-replica-move",
    company: "LinkedIn",
    title: "Move one replica to relieve a broker",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {loads, source, destination, sizes}. loads lists nonnegative integer broker loads. source and destination are distinct valid zero-based broker indices. Each positive integer in sizes is a candidate transfer size. A move is feasible when its size is at most the source load. Make exactly one feasible move, minimizing the largest load over all brokers, breaking ties by smaller size. Return {size, loads} with the new loads, or null when no move is feasible. Each load and transfer is at most 1 million.",
    explanation: "Compute the largest load among untouched brokers once, using zero if there are none. For each feasible size compare that load with the two changed loads. Minimize the resulting peak and then the transfer size. Apply the winner once to produce the reported loads.",
    cases: [
      {"name":"Balance all three brokers","input":{"loads":[12,8,4],"source":0,"destination":2,"sizes":[2,4,6]},"expected":{"size":4,"loads":[8,8,8]}},
      {"name":"Untouched broker decides the tie","input":{"loads":[13,20,1],"source":0,"destination":2,"sizes":[6,9,2]},"expected":{"size":2,"loads":[11,20,3]}},
      {"name":"A feasible move is mandatory","input":{"loads":[9,3],"source":1,"destination":0,"sizes":[2,1]},"expected":{"size":1,"loads":[10,2]}},
      {"name":"A candidate exceeds the source load","input":{"loads":[0,5,2],"source":1,"destination":0,"sizes":[7,3]},"expected":{"size":3,"loads":[3,2,2]}},
      {"name":"No feasible transfer","input":{"loads":[1,4],"source":0,"destination":1,"sizes":[2,3]},"expected":null}
    ]
  },
  {
    id: "microsoft-shortcut-stream",
    company: "Microsoft",
    title: "Resolve command palette shortcuts",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {shortcuts, events}. Each shortcut is [action, keySequence] with a unique nonempty sequence of case-sensitive key strings. Events are [milliseconds, key] pairs ordered by nondecreasing integer time. From the earliest unused event, consume the longest complete registered sequence beginning there whose consecutive keys are at most 400 ms apart. If none matches, skip only that first event. Repeat and return the action names in order. A gap of exactly 400 ms qualifies. End of input resolves pending prefixes.",
    explanation: "Use a trie or look ahead from each starting event. Remember the last terminal prefix and its length. On mismatch or timeout advance only past that completed prefix, or one event if there is none. This allows an unsuccessful continuation to start another shortcut.",
    cases: [
      {"name":"Longer chord takes precedence","input":{"shortcuts":[["prefix",["Ctrl-K"]],["comment",["Ctrl-K","Ctrl-C"]]],"events":[[0,"Ctrl-K"],[150,"Ctrl-C"],[800,"Ctrl-K"]]},"expected":["comment","prefix"]},
      {"name":"Deadline inclusive and one tick late","input":{"shortcuts":[["a",["A"]],["ab",["A","B"]],["b",["B"]]],"events":[[0,"A"],[400,"B"],[900,"A"],[1301,"B"]]},"expected":["ab","a","b"]},
      {"name":"Replay an unsuccessful continuation","input":{"shortcuts":[["a",["A"]],["abc",["A","B","C"]],["bd",["B","D"]]],"events":[[0,"A"],[10,"B"],[20,"D"]]},"expected":["a","bd"]},
      {"name":"Unbound prefix does not swallow a shortcut","input":{"shortcuts":[["long",["X","Y","Z"]],["short",["Y"]]],"events":[[1,"X"],[1,"Y"]]},"expected":["short"]},
      {"name":"Timeout applies to each consecutive pair","input":{"shortcuts":[["three",["A","B","C"]],["two",["A","B"]]],"events":[[20,"A"],[370,"B"],[720,"C"]]},"expected":["three"]}
    ]
  },
  {
    id: "nuro-calibration-budget",
    company: "Nuro",
    title: "Select calibration checks under a time limit",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {minutes, checks}. The integer budget is 0–240. checks contains at most 80 [positive integer duration, positive integer value] pairs in input order. Each check can run at most once. Return {value, indices} with the maximum total value within the budget and the increasing zero-based indices chosen. Among equal-value optima, choose the lexicographically earliest index list. Values are at most 1000.",
    explanation: "Fill a suffix knapsack table indexed by starting check and remaining minutes. Recover an optimum by scanning forward, taking the current check whenever it fits and can still attain the best remaining value. Positive values make this tie rule choose the earliest index list. The table takes O(number of checks × budget) space and time.",
    cases: [
      {"name":"Two medium checks beat the largest check","input":{"minutes":6,"checks":[[4,7],[3,6],[3,6]]},"expected":{"value":12,"indices":[1,2]}},
      {"name":"Equal values choose earliest list","input":{"minutes":4,"checks":[[2,3],[4,6],[2,3]]},"expected":{"value":6,"indices":[0,2]}},
      {"name":"An unused minute is allowed","input":{"minutes":5,"checks":[[4,8],[3,5],[3,6]]},"expected":{"value":8,"indices":[0]}},
      {"name":"Each check can run once","input":{"minutes":6,"checks":[[2,4],[5,9]]},"expected":{"value":9,"indices":[1]}},
      {"name":"Zero-minute budget","input":{"minutes":0,"checks":[[1,9]]},"expected":{"value":0,"indices":[]}}
    ]
  },
  {
    id: "oracle-named-savepoints",
    company: "Oracle",
    title: "Implement rollback to a named savepoint",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Start at integer value 0 with no savepoints. Read an array of operations. [\"add\", signedInteger] adjusts the value. [\"save\", name] stores the current value as the newest savepoint, replacing any older marker of that name while preserving other markers. [\"rollback\", name] restores its saved value and discards newer markers. The target remains valid. Ignore rollbacks to missing names. Return {value, savepoints}, listing valid names from oldest to newest. Names are case-sensitive and the running sum stays within 1 billion.",
    explanation: "Keep the current ledger total and an ordered set of named checkpoints with their saved totals. On rollback, trim from the newest checkpoint back to the target and restore its snapshot. Re-saving a name moves it to the newest position.",
    cases: [
      {"name":"Restore an earlier ledger value","input":[["add",5],["save","A"],["add",3],["save","B"],["add",4],["rollback","A"],["add",2]],"expected":{"value":7,"savepoints":["A"]}},
      {"name":"Reused name becomes the newest marker","input":[["add",1],["save","A"],["add",2],["save","B"],["add",4],["save","A"],["add",8],["rollback","A"]],"expected":{"value":7,"savepoints":["B","A"]}},
      {"name":"Discarded marker is unavailable","input":[["save","Z"],["add",3],["save","Y"],["rollback","Z"],["add",4],["rollback","Y"]],"expected":{"value":4,"savepoints":["Z"]}},
      {"name":"Rollback keeps target for reuse","input":[["add",-2],["save","X"],["add",3],["rollback","X"],["add",-8],["rollback","X"]],"expected":{"value":-2,"savepoints":["X"]}},
      {"name":"Empty ledger","input":[],"expected":{"value":0,"savepoints":[]}}
    ]
  },
  {
    id: "palantir-work-order-links",
    company: "Palantir",
    title: "Validate edits to a typed link",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an ordered array of [action, technician, order] triples. IDs are uppercase ASCII strings. An \"assign\" succeeds if the technician is free or already holds that same order. A \"release\" succeeds only when the technician holds that order. Different technicians may share an order. Reject other assignments and releases without changing state. Return {rejected, assignments}, with one-based rejected positions in arrival order and active [technician, order] pairs sorted by technician. Begin with no assignments.",
    explanation: "Map each technician to its active order. Validate each operation against the current mapping before updating it. Sharing an order between different technicians is valid, so only the technician must be unique. Preserve the original event position when recording a rejection.",
    cases: [
      {"name":"A blocked reassignment succeeds after release","input":[["assign","T","A"],["assign","U","B"],["assign","T","B"],["release","T","A"],["assign","T","B"]],"expected":{"rejected":[3],"assignments":[["T","B"],["U","B"]]}},
      {"name":"Mismatched release preserves the link","input":[["assign","X","B"],["release","X","C"],["assign","X","A"]],"expected":{"rejected":[2,3],"assignments":[["X","B"]]}},
      {"name":"Repeated assignment is accepted","input":[["assign","Z","A"],["assign","Z","A"],["assign","B","A"]],"expected":{"rejected":[],"assignments":[["B","A"],["Z","A"]]}},
      {"name":"Second release is rejected","input":[["release","K","C"],["assign","K","C"],["release","K","C"],["release","K","C"]],"expected":{"rejected":[1,4],"assignments":[]}},
      {"name":"No edits","input":[],"expected":{"rejected":[],"assignments":[]}}
    ]
  },
  {
    id: "paypal-settlement-day",
    company: "PayPal",
    title: "Compute daily net settlement",
    category: "Coding",
    languages: ["sql"],
    contract: "In SQLite, return [merchant, settlement_day, net_cents] for every observed merchant and settlement day. Events have uppercase ASCII merchant IDs, UTC timestamps formatted YYYY-MM-DD HH:MM:SS, and signed integer cents. Each row is a distinct settled event, even when all column values match. A day starts at 02:00:00 UTC inclusive. Label it with its start date as YYYY-MM-DD. Keep zero-net days. Sort by merchant, then by settlement day, both ascending.",
    explanation: "Subtract two hours from every UTC timestamp before taking its calendar date. This handles events crossing a month or year boundary. Group by merchant and the shifted date, sum the signed cents, and sort the resulting groups.",
    cases: [
      {"name":"Two sides of the settlement boundary","input":{"events":[["A","2026-07-03 01:59:00",90],["A","2026-07-03 02:00:00",-20]]},"expected":[["A","2026-07-02",90],["A","2026-07-03",-20]]},
      {"name":"Sort merchants and retain zero totals","input":{"events":[["Z","2026-08-02 03:00:00",6],["A","2026-08-02 15:00:00",-10],["A","2026-08-02 04:00:00",10],["A","2026-08-02 00:00:00",7]]},"expected":[["A","2026-08-01",7],["A","2026-08-02",0],["Z","2026-08-02",6]]},
      {"name":"Cross into the prior calendar year","input":{"events":[["B","2027-01-01 01:59:59",8],["B","2026-12-31 02:00:00",2]]},"expected":[["B","2026-12-31",10]]},
      {"name":"Identical events both contribute","input":{"events":[["M","2024-03-01 01:00:00",-4],["M","2024-03-01 01:00:00",-4]]},"expected":[["M","2024-02-29",-8]]},
      {"name":"No settled events","input":{"events":[]},"expected":[]}
    ],
    tables: [{"name":"events","columns":[{"name":"merchant","type":"TEXT"},{"name":"occurred_at","type":"TEXT"},{"name":"cents","type":"INTEGER"}]}],
    fixture: "events(merchant TEXT, occurred_at TEXT, cents INTEGER)"
  },
  {
    id: "pinterest-pipeline-rerun",
    company: "Pinterest",
    title: "Find jobs affected by an upstream rerun",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {start, edges}. Each [upstream, downstream] pair is a dependency between lowercase ASCII job names. Return all downstream jobs reachable from start, exactly once, excluding start. Order them topologically, choosing the alphabetically smallest available job at every step. Only dependencies whose endpoints are reachable from start (including start itself) participate. Return null for a cycle reachable from start. Duplicate edges describe a single dependency.",
    explanation: "Collect the reachable jobs with a graph traversal, counting each distinct edge once. Compute in-degrees within that reachable subgraph and repeatedly choose its smallest ready job. Remove start from the completed order. If some reachable jobs cannot be emitted, report a cycle.",
    cases: [
      {"name":"A branch rejoins at the board","input":{"start":"extract","edges":[["extract","palette"],["extract","text"],["palette","board"],["text","board"]]},"expected":["palette","text","board"]},
      {"name":"Choose the smallest newly available job","input":{"start":"s","edges":[["s","z"],["b","a"],["s","b"],["s","b"],["other","a"]]},"expected":["b","a","z"]},
      {"name":"Ignore an unrelated cycle","input":{"start":"one","edges":[["u","v"],["v","u"],["one","two"]]},"expected":["two"]},
      {"name":"Cycle back to the start","input":{"start":"base","edges":[["base","mid"],["mid","base"],["base","side"]]},"expected":null},
      {"name":"Start has no downstream jobs","input":{"start":"leaf","edges":[["root","leaf"]]},"expected":[]}
    ]
  },
  {
    id: "pure-storage-active-alerts",
    company: "Pure Storage",
    title: "Reconstruct open storage alerts",
    category: "Coding",
    languages: ["sql"],
    contract: "The alert_log table records a unique integer sequence, storage array ID, integer alert ID and action ('open' or 'close'). For each (array_id, alert_id), the greatest seq determines its current state. Return one [array_id, alert_id] row for each open alert, ordered by ASCII array ID and numeric alert ID. A close with no earlier open leaves the alert absent.",
    explanation: "Partition the log by both identifiers and rank events by descending sequence. Keep each pair’s newest event only when its action is open. Filtering closed events before ranking would incorrectly revive an older open.",
    cases: [
      {"name":"Same alert ID on different arrays","input":{"alert_log":[[1,"A",7,"open"],[2,"B",7,"open"],[3,"A",7,"close"],[4,"A",9,"open"],[5,"B",7,"open"]]},"expected":[["A",9],["B",7]]},
      {"name":"Reopened after an earlier close","input":{"alert_log":[[30,"S",2,"open"],[10,"S",2,"open"],[20,"S",2,"close"]]},"expected":[["S",2]]},
      {"name":"Unknown and repeated closes","input":{"alert_log":[[2,"C",3,"close"],[1,"C",1,"open"],[3,"C",1,"close"],[4,"C",1,"close"]]},"expected":[]},
      {"name":"Numeric alert sort within an array","input":{"alert_log":[[1,"Z",1,"open"],[2,"A",10,"open"],[3,"A",2,"open"]]},"expected":[["A",2],["A",10],["Z",1]]},
      {"name":"Empty export","input":{"alert_log":[]},"expected":[]}
    ],
    tables: [{"name":"alert_log","columns":[{"name":"seq","type":"INTEGER"},{"name":"array_id","type":"TEXT"},{"name":"alert_id","type":"INTEGER"},{"name":"action","type":"TEXT"}]}],
    fixture: "alert_log(seq INTEGER, array_id TEXT, alert_id INTEGER, action TEXT)"
  },
  {
    id: "reddit-recurring-event",
    company: "Reddit",
    title: "Find the next recurring community event",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read an array of [start, period, query] integer-minute triples. A schedule fires at start and at start + n × period for each positive integer n. For each triple return its first firing at or after query. A nonpositive period is invalid and returns null for that entry. All input integers have absolute value at most one billion.",
    explanation: "When the query precedes or equals the start, return start. Otherwise round the elapsed time up to a whole number of periods. The calculation takes constant time per entry even when millions of occurrences have passed.",
    cases: [
      {"name":"Exact and in-between firing times","input":[[5,7,19],[5,7,20],[5,7,2]],"expected":[19,26,5]},
      {"name":"Far-future queries","input":[[0,3,1000000000],[0,4,1000000000]],"expected":[1000000002,1000000000]},
      {"name":"Negative start and exact start","input":[[-8,5,-7],[-8,5,-8],[-8,5,-9]],"expected":[-3,-8,-8]},
      {"name":"Invalid periods remain independent","input":[[3,0,3],[0,-4,8],[3,1,7]],"expected":[null,null,7]},
      {"name":"No scheduled queries","input":[],"expected":[]}
    ]
  },
  {
    id: "roblox-blueprint-dependencies",
    company: "Roblox",
    title: "Validate a crafting graph",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {target, recipes}, where recipes maps each blueprint ID to its ordered prerequisite list. An ID absent from recipes is a leaf. Visit dependencies depth-first in their given order from target, building each ID once. If there is no reachable cycle, return {order:[...]} with each dependency before its dependent. On the first edge to an active ID, return {cycle:[...]} from that ID along the active path through the repeated ID inclusive. IDs are uppercase ASCII letters and digits, with at most 100 distinct IDs.",
    explanation: "Mark each blueprint active when entering it and complete after processing its children. A second visit to a completed blueprint needs no work. An edge to an active blueprint identifies a cycle on the current stack. Work is linear in the reachable vertices and edges.",
    cases: [
      {"name":"Shared prerequisite built once","input":{"target":"A","recipes":{"A":["B","C"],"B":["D"],"C":["D"]}},"expected":{"order":["D","B","C","A"]}},
      {"name":"Ignore a disconnected cycle","input":{"target":"X","recipes":{"X":["Z","Y"],"A":["A"]}},"expected":{"order":["Z","Y","X"]}},
      {"name":"Report a cycle below the target","input":{"target":"A","recipes":{"A":["D","B"],"B":["E"],"E":["C"],"C":["B"]}},"expected":{"cycle":["B","E","C","B"]}},
      {"name":"Self-dependent blueprint","input":{"target":"A","recipes":{"A":["A","B"]}},"expected":{"cycle":["A","A"]}},
      {"name":"Leaf target","input":{"target":"Q","recipes":{}},"expected":{"order":["Q"]}}
    ]
  },
  {
    id: "salesforce-delivery-checkpoint",
    company: "Salesforce",
    title: "Advance a replay checkpoint across completed events",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {delivery, completed}. delivery lists distinct event IDs in receipt order. completed lists acknowledgments in processing order and may repeat IDs; each acknowledged ID occurs in delivery. After each acknowledgment, return the last ID of the fully acknowledged prefix of delivery, or null if the prefix is empty. Return the sequence of checkpoints.",
    explanation: "Track acknowledged IDs and an index into delivery. On each acknowledgment, advance the index while the next event is acknowledged. Each delivery is passed at most once, for linear expected time across both input lists.",
    cases: [
      {"name":"Fill two separate gaps","input":{"delivery":["m7","q2","b9","z4"],"completed":["q2","z4","m7","b9"]},"expected":[null,null,"q2","z4"]},
      {"name":"A missing first acknowledgment","input":{"delivery":["v","x","a"],"completed":["a","x"]},"expected":[null,null]},
      {"name":"Repeated acknowledgments","input":{"delivery":["w","u"],"completed":["w","w","u","w"]},"expected":["w","w","u","u"]},
      {"name":"Release an entire pending suffix","input":{"delivery":["f","e","d","c"],"completed":["c","d","e","f"]},"expected":[null,null,null,"c"]},
      {"name":"No acknowledgments","input":{"delivery":["a","b"],"completed":[]},"expected":[]}
    ]
  },
  {
    id: "snapchat-sparse-stickers",
    company: "Snapchat",
    title: "Apply sparse image stickers",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {width,height,layers}. Canvas coordinates start at (0,0) in the top left and extend right and down. Each layer is {x,y,pixels} with an integer origin and pixels [dx,dy,color]. Apply layers and pixels in input order. Omitted pixels are transparent. Discard pixels outside the canvas. Return painted pixels as [x,y,color] triples sorted by y then x. Dimensions are positive integers up to one million and colors are strings.",
    explanation: "Translate each supplied pixel by its layer origin. Store only in-bounds coordinates, overwriting earlier colors at the same location. Sort the resulting sparse coordinates by row and column. Memory depends on the number of painted coordinates.",
    cases: [
      {"name":"Clip and overlay","input":{"width":3,"height":2,"layers":[{"x":0,"y":0,"pixels":[[0,0,"red"],[1,0,"blue"],[2,1,"green"]]},{"x":1,"y":0,"pixels":[[0,0,"gold"],[2,0,"white"],[0,1,"pink"]]}]},"expected":[[0,0,"red"],[1,0,"gold"],[1,1,"pink"],[2,1,"green"]]},
      {"name":"Negative origin crosses the corner","input":{"width":2,"height":2,"layers":[{"x":-2,"y":-1,"pixels":[[1,1,"left"],[2,0,"above"],[2,1,"inside"],[3,2,"corner"]]}]},"expected":[[0,0,"inside"],[1,1,"corner"]]},
      {"name":"Huge sparse canvas ordered by row","input":{"width":1000000,"height":1000000,"layers":[{"x":0,"y":0,"pixels":[[2,3,"c"],[12,1,"b"],[2,1,"a"]]}]},"expected":[[2,1,"a"],[12,1,"b"],[2,3,"c"]]},
      {"name":"Empty and entirely offscreen layers","input":{"width":1,"height":1,"layers":[{"x":0,"y":0,"pixels":[]},{"x":1,"y":1,"pixels":[[0,0,"black"]]}]},"expected":[]},
      {"name":"Multiple writes in one layer","input":{"width":2,"height":1,"layers":[{"x":1,"y":0,"pixels":[[0,0,"old"],[0,0,"new"]]}]},"expected":[[1,0,"new"]]}
    ]
  },
  {
    id: "square-stocktake-balances",
    company: "Square (Block)",
    title: "Apply a stocktake at its observation time",
    category: "Coding",
    languages: ["sql"],
    contract: "For each item in opening_stock, return [item, ending_units] sorted by ASCII item ID. stock_event rows may arrive in any order. Apply them in ascending (minute, seq) order; seq is unique. A 'count' sets stock to units, while a 'sale' subtracts units. Quantities are nonnegative integers. Every event refers to an item in opening_stock, where each item appears once. Items with no events keep their opening stock.",
    explanation: "Use the latest physical count for each item as the opening point, or the original balance if no count exists. Subtract the sales observed after that point. Keep items with no sales or counts by starting from opening_stock.",
    cases: [
      {"name":"Late delivery of a physical count","input":{"opening_stock":[["A",10]],"stock_event":[["A",550,3,"sale",3],["A",545,2,"count",7],["A",540,1,"sale",2]]},"expected":[["A",4]]},
      {"name":"Same-minute sequence","input":{"opening_stock":[["A",20]],"stock_event":[["A",6,9,"sale",2],["A",6,3,"sale",4],["A",6,7,"count",10]]},"expected":[["A",8]]},
      {"name":"Most recent count can be smaller","input":{"opening_stock":[["B",5]],"stock_event":[["B",1,1,"count",15],["B",2,2,"sale",2],["B",3,3,"count",4],["B",4,4,"sale",1]]},"expected":[["B",3]]},
      {"name":"Keep inactive items and sale-only items","input":{"opening_stock":[["C",3],["A",5],["B",12]],"stock_event":[["B",4,1,"sale",2],["A",1,2,"count",0]]},"expected":[["A",0],["B",10],["C",3]]},
      {"name":"Empty catalog","input":{"opening_stock":[],"stock_event":[]},"expected":[]}
    ],
    tables: [{"name":"opening_stock","columns":[{"name":"item","type":"TEXT"},{"name":"units","type":"INTEGER"}]},{"name":"stock_event","columns":[{"name":"item","type":"TEXT"},{"name":"minute","type":"INTEGER"},{"name":"seq","type":"INTEGER"},{"name":"kind","type":"TEXT"},{"name":"units","type":"INTEGER"}]}],
    fixture: "opening_stock(item TEXT, units INTEGER); stock_event(item TEXT, minute INTEGER, seq INTEGER, kind TEXT, units INTEGER)"
  },
  {
    id: "tesla-telemetry-changes",
    company: "Tesla",
    title: "Compress changes in a telemetry signal",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {readings, threshold}. readings is a sequence of signed integer measurements; threshold is a positive integer. Transmit the first reading, then a reading only when its absolute difference from the last transmitted reading is at least threshold. Return [zero-based index, reading] pairs in transmission order. An empty input produces an empty list.",
    explanation: "Keep the value most recently emitted. A skipped value leaves that baseline intact, so a sequence of small changes can eventually trigger transmission. Scan once using constant auxiliary space, excluding the output.",
    cases: [
      {"name":"A skipped sample leaves the baseline intact","input":{"readings":[20,21,22,21,19,20],"threshold":2},"expected":[[0,20],[2,22],[4,19]]},
      {"name":"First and final values only","input":{"readings":[7,8,9,10,11],"threshold":4},"expected":[[0,7],[4,11]]},
      {"name":"Negative values at the exact threshold","input":{"readings":[-1,-4,-2,-1,-4],"threshold":3},"expected":[[0,-1],[1,-4],[3,-1],[4,-4]]},
      {"name":"Constant signal","input":{"readings":[0,0,0],"threshold":1},"expected":[[0,0]]},
      {"name":"No signal","input":{"readings":[],"threshold":2},"expected":[]}
    ]
  },
  {
    id: "whatnot-postage-bands",
    company: "Whatnot",
    title: "Assign listings to postage bands",
    category: "Coding",
    languages: ["python","javascript"],
    contract: "Read {bands, weights}. Each [lower,upper] postage band contains integer weights strictly greater than lower and at most upper. Bounds are nonnegative, lower < upper, and bands are sorted and do not overlap. Gaps are allowed. For every package weight in grams, return the matching 1-based band number, or null when unassigned. Weights are nonnegative integers.",
    explanation: "Binary-search the upper bounds for the first value at least as large as the weight. Verify the exclusive lower bound on that candidate to handle gaps. With b bands and w weights the lookup takes O(w log(b + 1)) time.",
    cases: [
      {"name":"Boundaries and unsupported packages","input":{"bands":[[0,100],[100,250],[250,500]],"weights":[100,101,250,501,0]},"expected":[1,2,2,null,null]},
      {"name":"An uncovered gap and its edges","input":{"bands":[[10,20],[30,40]],"weights":[10,11,20,21,30,31,40]},"expected":[null,1,1,null,null,2,2]},
      {"name":"No configured bands","input":{"bands":[],"weights":[0,100]},"expected":[null,null]},
      {"name":"Repeated weights stay in input order","input":{"bands":[[0,1],[1,2],[2,3]],"weights":[3,1,2,3]},"expected":[3,1,2,3]},
      {"name":"No packages","input":{"bands":[[1,500]],"weights":[]},"expected":[]}
    ]
  }
];

// Custom inputs use the same table schemas and seed format as the graded fixtures.
window.NotebookSQLFixture = function makeSQLFixture(problem, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Provide a JSON object with one array of rows per table.');
  }
  const tables = problem.tables;
  const names = Object.keys(input);
  if (names.length !== tables.length || !tables.every(table => Object.hasOwn(input, table.name))) {
    throw new Error('Expected these tables: ' + tables.map(table => table.name).join(', '));
  }
  const statements = [];
  let count = 0;
  for (const table of tables) {
    const rows = input[table.name];
    if (!Array.isArray(rows) || (count += rows.length) > 500) {
      throw new Error('Each table must be an array; the fixture supports up to 500 total rows.');
    }
    const definition = table.columns.map(column => column.name + ' ' + column.type + ' NOT NULL');
    statements.push('CREATE TABLE ' + table.name + ' (' + definition.join(', ') + ');');
    for (const [index, row] of rows.entries()) {
      if (!Array.isArray(row) || row.length !== table.columns.length) {
        throw new Error(table.name + ' row ' + (index + 1) + ' needs ' + table.columns.length + ' values.');
      }
      const values = row.map((value, offset) => {
        const column = table.columns[offset];
        if (column.type === 'INTEGER' && Number.isSafeInteger(value)) return String(value);
        if (column.type === 'TEXT' && typeof value === 'string' && !value.includes('\0') && value.length <= 2000) {
          return "'" + value.replaceAll("'", "''") + "'";
        }
        throw new Error(table.name + ' row ' + (index + 1) + ' needs ' + column.type + ' in ' + column.name + '.');
      });
      statements.push('INSERT INTO ' + table.name + ' VALUES (' + values.join(', ') + ');');
    }
  }
  return statements.join('\n');
};

for (const problem of window.NotebookProblems) {
  problem.example = problem.cases[0].input;
  if (problem.tables) {
    for (const test of problem.cases) test.setup = window.NotebookSQLFixture(problem, test.input);
  }
}
