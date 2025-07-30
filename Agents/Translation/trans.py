from flask import Flask, request, jsonify, send_file # type: ignore
from transformers import AutoProcessor, SeamlessM4Tv2Model # type: ignore

from flask_cors import CORS # type: ignore

app = Flask(__name__)
CORS(app)


model_name = "facebook/seamless-m4t-v2-large"
tokenizer = AutoProcessor.from_pretrained(model_name)
model = SeamlessM4Tv2Model.from_pretrained(model_name)


def translate_ttt(inp, src, tgt, tokenizer, model):
    inputs = tokenizer(text=inp, src_lang=src, return_tensors="pt")

    out_tokens = model.generate(**inputs, tgt_lang=tgt, generate_speech=False)
    trans_tokens = out_tokens[0].tolist()[0]

    return tokenizer.decode(trans_tokens, skip_special_tokens=True)


@app.route('/')
def check_active():
    return jsonify({'status':'active'})


@app.route('/ttt',methods=["POST"])
def ttt_translate():
    if 'text' not in request.form:
        return jsonify({'error': "Missing Input text"}), 400
    
    if 'src' not in request.form:
        return jsonify({'error': "Missing Source Language"}), 400
    
    if 'tgt' not in request.form:
        return jsonify({'error': "Missing Target Language"}), 400
    
    try:
        text = request.form['text']
        src = request.form['src']
        tgt = request.form['tgt']
        translated_text = translate_ttt(text,src,tgt,tokenizer,model)
        
        return jsonify({'output':translated_text}),200
    
    except Exception as e:
        print(e)
        return jsonify({'error': "An error occured..."}), 500


if __name__ == '__main__':
    app.run(port=8000, threaded=False, debug=True)

# set TF_ENABLE_ONEDNN_OPTS=0