/* Disposable execution realm. Never evaluate learner Python on the app thread. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.js');
let python;
async function initialize(){try{python=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/'});postMessage({ready:true});}catch(e){postMessage({passed:false,tests:[],output:'',error:String(e)});}}
initialize();
onmessage=async({data})=>{let output='';const append=s=>{if(output.length<data.cap)output+=(s+'\n').slice(0,data.cap-output.length);};python.setStdout({batched:append});python.setStderr({batched:append});try{await python.loadPackagesFromImports(data.code);postMessage({executing:true});python.globals.set('_learner_code',data.code);python.globals.set('_checks',JSON.stringify(data.tests));const result=await python.runPythonAsync(`
import json, traceback
_scope = {}
_results = []
try:
    exec(_learner_code, _scope)
    for _i, _test in enumerate(json.loads(_checks)):
        try:
            exec(_test, _scope)
            _results.append({'name': 'Test ' + str(_i + 1), 'passed': True})
        except BaseException as _e:
            _results.append({'name': 'Test ' + str(_i + 1), 'passed': False, 'error': str(_e) or type(_e).__name__})
except BaseException as _e:
    _results.append({'name': 'Program', 'passed': False, 'error': traceback.format_exc(limit=3)})
json.dumps(_results)
`);const tests=JSON.parse(result);postMessage({passed:tests.length>0&&tests.every(t=>t.passed),tests,output:output+(output.length>=data.cap?'\n[Output capped]':'' )});}catch(e){postMessage({passed:false,tests:[],output,error:String(e)});}};
