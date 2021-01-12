from flask import Flask, redirect, render_template, request, url_for, session
from flask import make_response

from skrutable.transliteration import Transliterator
from skrutable.scansion import Scanner
from skrutable.meter_identification import MeterIdentifier
T = Transliterator()
S = Scanner()
V = None
MI = MeterIdentifier()

app = Flask(__name__)
app.config["DEBUG"] = True
app.config["SECRET_KEY"] = "asdlkvumnxlapoiqyernxnfjtuzimzjdhryien"

select_element_names = [
    "skrutable_action",
    "text_input", "text_output",
    "from_scheme", "to_scheme",
    "resplit_option"
    ]
checkbox_element_names = [
    "weights", "morae", "gaRas",
    "alignment"
    ]
session_variable_names = (
    select_element_names +
    checkbox_element_names
    )

def process_form(form):

   # first do values of "select" elements
    for var_name in select_element_names:
        session[var_name] = request.form[var_name]

    # then do values of "checkbox" elements
    scan_detail_option_choices = request.form.getlist("scan_detail")
    for var_name in checkbox_element_names:
        if var_name in scan_detail_option_choices:
            session[var_name] = 1
        else:
            session[var_name] = 0

    session.modified = True

@app.route("/", methods=["GET", "POST"])
def index():

    # just in case, make sure all keys in session
    for var_name in session_variable_names:
        if var_name not in session:
            reset_variables()

    if request.method == "GET":

        return render_template(
            "main.html",
            skrutable_action=session["skrutable_action"],
            text_input=session["text_input"], text_output=session["text_output"],
            from_scheme=session["from_scheme"], to_scheme=session["to_scheme"],
            weights=session["weights"],
            morae=session["morae"],
            gaRas=session["gaRas"],
            alignment=session["alignment"],
            resplit_option=session["resplit_option"]
            )

    if request.method == "POST":

        process_form(request.form)

        # carry out chosen action

        if session["skrutable_action"] == "transliterate":

            session["text_output"] = T.transliterate(
                session["text_input"],
                from_scheme=session["from_scheme"],
                to_scheme=session["to_scheme"]
                )

        elif session["skrutable_action"] == "scan":

            V = S.scan(
                session["text_input"] ,
                from_scheme=session["from_scheme"]
                )

            session["text_output"] = V.summarize(
                show_weights=session["weights"],
                show_morae=session["morae"],
                show_gaRas=session["gaRas"],
                show_alignment=session["alignment"],
                show_label=False
                )

        elif session["skrutable_action"] == "identify meter":

            V = MI.identify_meter(
                session["text_input"] ,
                resplit_option=session["resplit_option"],
                from_scheme=session["from_scheme"]
                )

            session["text_output"] = V.summarize(
                show_weights=session["weights"],
                show_morae=session["morae"],
                show_gaRas=session["gaRas"],
                show_alignment=session["alignment"],
                show_label=True
                )

        session.modified = True

        return redirect(url_for('index'))


@app.route("/wholeFile", methods=["POST"])
def wholeFile():

    # when form sent from GUI ("whole file" button clicked)
    if request.form != {}:

        process_form(request.form)

        # send onward to upload form
        return render_template(
            "wholeFile.html",
            skrutable_action=session["skrutable_action"],
            text_input=session["text_input"], text_output=session["text_output"],
            from_scheme=session["from_scheme"], to_scheme=session["to_scheme"],
            weights=session["weights"], morae=session["morae"], gaRas=session["gaRas"],
            alignment=session["alignment"],
            resplit_option=session["resplit_option"]
            )

    # when file chosen for upload
    elif request.files != {}:

        # session variables already processed in previous step

        # take in and read file
        input_file = request.files["input_file"]
        input_data = input_file.stream.read().decode('utf-8')

        # carry out chosen action

        if session["skrutable_action"] == "transliterate":

            output_data = T.transliterate(
                input_data,
                from_scheme=session["from_scheme"],
                to_scheme=session["to_scheme"]
                )

        elif session["skrutable_action"] == "identify meter":

            from datetime import datetime
            now = datetime.now()
            timestamp1 = now.strftime("%H:%M:%S")

            verses = input_data.split('\n')
            output_data = "%s\n" % timestamp1
            for verse in verses:

            	result = MI.identify_meter(
            	    verse,
            	    resplit_option=session['resplit_option'],
            	    from_scheme=session['from_scheme']
            	    )

            	output_data += (
            	    result.text_raw + '\n' +
            	    result.summarize(
                	    show_weights=session["weights"],
                        show_morae=session["morae"],
                        show_gaRas=session["gaRas"],
                        show_alignment=session["alignment"],
                        show_label=True
                        ) +
                    '\n'
                    )

            now = datetime.now()
            timestamp2 = now.strftime("%H:%M:%S")
            output_data += timestamp2

        # prepare and return output file
        response = make_response( output_data )
        response.headers["Content-Disposition"] = "attachment; filename=result.txt"
        return response

@app.route('/reset')
def reset_variables():
    session["skrutable_action"] = "..."
    session["text_input"] = ""; session["text_output"] = ""
    session["from_scheme"] = "IAST"; session["to_scheme"] = "IAST"
    session["weights"] = 1; session["morae"] = 1; session["gaRas"] = 1
    session["alignment"] = 1
    session["resplit_option"] = "resplit_hard"
    session.modified = True
    return redirect(url_for('index'))

@app.route('/about')
def about_page():
    return render_template("about.html")

@app.route('/tutorial')
def tutorial_page():
    return render_template("tutorial.html")

@app.route('/next')
def next_page():
    return render_template("next.html")

@app.route('/scanGRETIL')
def scanGRETIL_page():
    return render_template("scanGRETIL.html")

@app.route('/scanGRETILresults')
def scanGRETILresults_page():
    return render_template("scanGRETILresults.html")

@app.route('/ex1')
def ex1():
    session["text_input"] = "dharmakṣetre kurukṣetre samavetā yuyutsavaḥ /\nmāmakāḥ pāṇḍavāś caiva kim akurvata sañjaya //"
    session["text_output"] = ""
    session["from_scheme"] = "IAST"; session["to_scheme"] = "DEV"
    session["weights"] = 1; session["morae"] = 1; session["gaRas"] = 1
    session["alignment"] = 1
    session["resplit_option"] = "resplit_hard"
    session["skrutable_action"] = "transliterate"
    session.modified = True
    return redirect(url_for('index'))