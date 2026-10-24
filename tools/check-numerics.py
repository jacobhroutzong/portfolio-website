"""Independent randomized checks of original reference implementations."""
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
def reference(name):
    scope = {}
    exec(json.loads((ROOT / 'content' / 'solutions' / (name + '.json')).read_text())['reference'], scope)
    return scope

rng = np.random.default_rng(42)
softmax = reference('softmax-stable')['solve']
attention = reference('attention-head')['solve']
multihead = reference('multihead')['solve']
Value = reference('autograd-scalar')['Value']
sgd = reference('sgd')['solve']
for _ in range(30):
    logits = rng.normal(0, 100, size=17)
    expected = np.exp(logits - np.logaddexp.reduce(logits))
    np.testing.assert_allclose(softmax(logits.tolist()), expected, atol=1e-12)
    q, k = rng.normal(size=(2, 5, 4))
    v = rng.normal(size=(5, 3))
    scores = np.einsum('id,jd->ij', q, k) / 2
    expected = np.zeros((5, 3))
    for i in range(5):
        row = scores[i, :i+1]
        weights = np.exp(row - np.logaddexp.reduce(row))
        expected[i] = np.einsum('j,jd->d', weights, v[:i+1])
    np.testing.assert_allclose(attention(q, k, v), expected, atol=1e-10)
    x = rng.normal(size=(5, 8))
    expected_heads = np.concatenate([attention(x[:, j:j+2], x[:, j:j+2], x[:, j:j+2]) for j in range(0, 8, 2)], axis=1)
    np.testing.assert_allclose(multihead(x, 4), expected_heads, atol=1e-10)
    a = float(rng.normal()); node = Value(a); output = node*node*node + 2*node; output.backward()
    np.testing.assert_allclose(node.grad, np.polynomial.polynomial.polyval(a, [2,0,3]), atol=1e-10)
    w, g = rng.normal(size=(2, 12))
    np.testing.assert_allclose(sgd(w.tolist(), g.tolist(), .03), w-.03*g, atol=1e-12)
print('150 randomized numerical comparisons passed (NumPy, seed 42).')
