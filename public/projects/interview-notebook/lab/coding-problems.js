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
