from flask import Flask, request, jsonify, send_file # type: ignore
from transformers import AutoProcessor, SeamlessM4Tv2Model # type: ignore
from flask_cors import CORS # type: ignore
import torchaudio

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


def translate_stt(inp, src, tgt, processor, model):
    audio, orig_freq =  torchaudio.load(inp)
    audio =  torchaudio.functional.resample(audio, orig_freq=orig_freq, new_freq=16_000) # must be a 16 kHz waveform array
    audio_inputs = processor(audios=audio, return_tensors="pt")
    audio_array_from_audio = model.generate(**audio_inputs, tgt_lang=tgt,generate_speech=False)[0]
    text = processor.batch_decode(audio_array_from_audio, skip_special_tokens=True)[0]
    return text


@app.route('/')
def check_active():
    return jsonify({'status':'active'})


@app.route('/stt',methods=["POST"])    
def stt_translate():
  if 'audio' not in request.files:
        return jsonify({'error': "Missing Input text"}), 400
  if 'src' not in request.form:
        return jsonify({'error': "Missing Source Language"}), 400    
  if 'tgt' not in request.form:
        return jsonify({'error': "Missing Target Language"}), 400

  try:
      audio = request.files['audio']      
      src = request.form['src']
      tgt = request.form['tgt']
      translated_speech_to_text=translate_stt(audio,src,tgt,tokenizer,model)
      return jsonify({'output':translated_speech_to_text}),200

  except Exception as e:
    print(e)
    return jsonify({'error':"An error occured..."}), 500


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