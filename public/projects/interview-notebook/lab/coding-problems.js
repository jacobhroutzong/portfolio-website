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
