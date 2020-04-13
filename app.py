from flask import Flask, flash, redirect, render_template, request, session, abort, url_for, jsonify
import csv
import os
import pandas as pd
from pandas import DataFrame, read_csv
from werkzeug.utils import secure_filename
import datetime as dt
from math import ceil
import json


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLD = 'tmp'
UPLOAD_FOLDER = os.path.join(APP_ROOT, UPLOAD_FOLD)
FILENAME = 'buf.csv'
max_time = ''
min_time = ''
times = []


ALLOWED_EXTENSIONS = {'csv'}
app = Flask(__name__)
app.secret_key = "super secret key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def Merge(dict1, dict2):
    return(dict2.update(dict1))

def week_of_month(dt):
    """ Returns the week of the month for the specified date.
    """
    first_day = dt.replace(day=1)

    dom = dt.day
    adjusted_dom = dom + first_day.weekday()

    weekdays = int(ceil(adjusted_dom/7.0))

    return int(ceil(adjusted_dom/7.0))

def get_weeks(str_datetime):
    datetime_object = dt.datetime.strptime(str_datetime[2:10], '%y-%m-%d')
    weeks = week_of_month(datetime_object)
    return str(weeks)

def get_weekdays(str_datetime):

    year = int(str_datetime[:4])
    month = int(str_datetime[5:7])
    day = int(str_datetime[8:10])

    weekdays = dt.datetime(year,month,day).weekday()

    if(weekdays >= 4):
        return get_weeks(str_datetime) + ". Weekend"
    else:
        return get_weeks(str_datetime) + ". Weekdays"

def get_time_status(str_datetime):

    time_status = int(str_datetime[11:13])

    if 6 <= time_status <= 13:
        return get_weeks(str_datetime) + ". Morning"
    elif 14 <= time_status <= 22:
        return get_weeks(str_datetime) + ". Afternoon"
    else:
        return get_weeks(str_datetime) + ". Night"


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/ajax_analyze", methods=['GET','POST'])
def ajax_analyze():

    sign = ''
    min_date = request.args.get('min_date')
    max_date = request.args.get('max_date')
    analyze_type = request.args.get('id')

    df = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], FILENAME))

    times = df['created_at'].apply(lambda x: x[:13]).unique()
    df["times"] = df["created_at"].apply(lambda x: x[:13])
    df["datetime"] = df["created_at"].apply(lambda x: x[:10])

    df = df[df['temperature'] != 'None']

    if analyze_type == "temperature":
        df["temperature"] = df["temperature"].apply(lambda x: float(x))
        sign = "°C"
    elif analyze_type == "humidity":
        df["humidity"] = df["humidity"].apply(lambda x: float(x))
        sign = "%"
    elif analyze_type == "pm1":
        df["pm1"] = df["pm1"].apply(lambda x: float(x))
        sign = "pm"
    elif analyze_type == "pm2":
        df["pm2"] = df["pm2"].apply(lambda x: float(x))
        sign = "pm"
    elif analyze_type == "postion":
        df["latitude"] = df["latitude"].apply(lambda x: float(x))
        df["longitude"] = df["longitude"].apply(lambda x: float(x))
    else :
        df["pm3"] = df["pm3"].apply(lambda x: float(x))
        sign = "pm"

    analyze_df = df[df.times >= min_date]
    analyze_df = analyze_df[analyze_df.times <= (max_date + " 24")]

    means = None

    if analyze_type == "temperature":
        means = analyze_df.groupby('times')['temperature'].mean()
    elif analyze_type == "humidity":
        means = analyze_df.groupby('times')['humidity'].mean()
    elif analyze_type == "pm1":
        means = analyze_df.groupby('times')['pm1'].mean()
    elif analyze_type == "pm2":
        means = analyze_df.groupby('times')['pm2'].mean()
    else:
        means = analyze_df.groupby('times')['pm3'].mean()

    latitude = analyze_df.groupby('latitude')['latitude'].mean()
    longitude = analyze_df.groupby('longitude')['longitude'].mean()

    period_mean = dict(means)

    df['weekday'] = df['created_at'].apply(lambda x: get_weekdays(x))
    df['time_status'] = df['created_at'].apply(lambda x: get_time_status(x))

    k = 0
    pie_weekday_means = None
    pie_timestatus_means = None
    postion = []
    if analyze_type == "temperature":
        pie_weekday_means = df.groupby('weekday')['temperature'].mean()
        pie_timestatus_means = df.groupby('time_status')['temperature'].mean()
    elif analyze_type == "humidity":
        pie_weekday_means = df.groupby('weekday')['humidity'].mean()
        pie_timestatus_means = df.groupby('time_status')['humidity'].mean()
    elif analyze_type == "pm1":
        pie_weekday_means = df.groupby('weekday')['pm1'].mean()
        pie_timestatus_means = df.groupby('time_status')['pm1'].mean()
    elif analyze_type == "pm2":
        pie_weekday_means = df.groupby('weekday')['pm2'].mean()
        pie_timestatus_means = df.groupby('time_status')['pm2'].mean()
    elif analyze_type == 'position':
        for va in list(dict(latitude).values()):
            tmp = {'latitude': str(round(list(dict(latitude).values())[k], 2)), 'longitude': str(round(list(dict(longitude).values())[k], 2))}
            postion.append(tmp)
            k += 1
        return json.dumps({'position': postion})
        exit();
    else:
        pie_weekday_means = df.groupby('weekday')['pm3'].mean()
        pie_timestatus_means = df.groupby('time_status')['pm3'].mean()

###############################################################################
    pie_dict_weekday_mean = dict(pie_weekday_means)
    pie_dict_timestatus_mean = dict(pie_timestatus_means)


    i = 0
    pi_data = []
    tem_data = []
    r_data = []
    for temp in list(pie_dict_timestatus_mean.values()):
        tem_data.append(temp)
        i += 1
        if(i % 3 == 0):
            r_data.append(tem_data)
            tem_data = []
    tem_data = []
    w_data = []
    for temps in list(pie_dict_weekday_mean.values()):
        tem_data.append(temps)
        i += 1
        if(i % 2 == 0):
            w_data.append(tem_data)
            tem_data = []
    m = 1
    n = 0
    print(w_data)
    strdata = "{}. week"
    for n in range(len(w_data)):
        subdata = [{'name': "Afternoon", 'value': str(round(r_data[n][0],2))},
                   {'name': "Morning", 'value': str(round(r_data[n][1],2))},
                   {'name': "Night", 'value': str(round(r_data[n][2],2))},
                   {'name': "weekend", 'value': str(round(w_data[n][0], 2))},
                   {'name': "weekday", 'value': str(round(w_data[n][1], 2))}]
        tmp = {
            "country": strdata.format(n+1),
            "litres": 500,
            "subData": subdata
        }
        pi_data.append(tmp)

######################################################################
    date_time = list(period_mean.keys())
    value = list(period_mean.values())
    temperature_time = []
    tmp = {}
    i = 0
    total_value = 0;
    for values in period_mean:
        date_time[i] = date_time[i]
        time = int(date_time[i].split(" ")[1])
        day = int(date_time[i].split(" ")[0].split("-")[2])
        month = int(date_time[i].split(" ")[0].split("-")[1])
        year = int(date_time[i].split(" ")[0].split("-")[0])

        tmp = {
            'year'  : year,
            'month' : month,
            'day'   : day,
            'time'  : time,
            'value' : str(round(value[i],2))
        }
        temperature_time.append(tmp)
        total_value += float(str(round(value[i],2)))
        i += 1
    average_value = total_value/i
    status = 1
    if analyze_type == "temperature":
        if average_value > 20:
            status = 0

    elif analyze_type == "humidity":
        if average_value > 70:
            status = 0
    elif analyze_type == "pm1":
        if average_value > 40:
            status = 0
    elif analyze_type == "pm2":
        if average_value > 25:
            status = 0
    else:
        if average_value > 25:
            status = 0
##############################################################################

    return json.dumps({'temperature_date':temperature_time, 'pi_data':pi_data, 'sign':sign, 'status':status});

@app.route('/upload.html', methods=['GET','POST'])
def upload_file(filename=None,column=None, data=None):
    if request.method == 'POST':
        if 'file' not in request.files:
            flash("No file part")
            return redirect(request.url)

        file = request.files['file']

        if file.filename == '':
            flash("No selected file")
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)

            file_path = os.path.join(app.config['UPLOAD_FOLDER'], FILENAME)
            file.save(file_path)

            df = pd.read_csv(file_path)

            max_value = df.loc[df['created_at'] == df['created_at'].max(), 'created_at']
            max_time = max_value.iloc[0][:10]

            min_value = df.loc[df['created_at'] == df['created_at'].min(), 'created_at']
            min_time = min_value.iloc[0][:10]

            times = df['created_at'].apply(lambda x: x[:10]).unique()

    return render_template('index.html', filename=filename, max_time=max_time, min_time=min_time, times=list(times))

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)