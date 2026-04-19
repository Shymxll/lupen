from flask import Flask, request, jsonify
from flask_cors import CORS
import gamspy as gp

app = Flask(__name__)
CORS(app)


@app.route('/solve-knapsack', methods=['POST'])
def solve_knapsack():
    data = request.get_json()
    items = data['items']       # [{id, weight, value}, ...]
    capacity = data['capacity']

    m = gp.Container()

    item_keys = [f'item_{item["id"]}' for item in items]

    I = gp.Set(m, name='I', records=item_keys)

    w = gp.Parameter(m, name='w', domain=[I],
                     records=[(f'item_{it["id"]}', it['weight']) for it in items])
    v = gp.Parameter(m, name='v', domain=[I],
                     records=[(f'item_{it["id"]}', it['value']) for it in items])

    x = gp.Variable(m, name='x', domain=[I], type='binary')
    z = gp.Variable(m, name='z')

    weight_con = gp.Equation(m, name='weight_con')
    weight_con[...] = gp.Sum(I, w[I] * x[I]) <= capacity

    obj_def = gp.Equation(m, name='obj_def')
    obj_def[...] = z == gp.Sum(I, v[I] * x[I])

    model = gp.Model(
        m,
        name='knapsack',
        equations=[weight_con, obj_def],
        problem='MIP',
        sense=gp.Sense.MAX,
        objective=z,
    )
    model.solve()

    key_to_id = {f'item_{item["id"]}': item['id'] for item in items}

    selected_keys = (
        x.records[x.records['level'] > 0.5]['i'].tolist()
        if x.records is not None
        else []
    )
    selected_ids = [key_to_id[k] for k in selected_keys if k in key_to_id]

    total_value = float(z.records['level'].values[0]) if z.records is not None else 0.0

    return jsonify({'selected_ids': selected_ids, 'total_value': total_value})


if __name__ == '__main__':
    app.run(port=5000, debug=True)
