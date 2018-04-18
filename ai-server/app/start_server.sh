#!/bin/bash 

_term() { 
  echo "Caught SIGTERM signal!" 
  #kill -TERM "$child" 2>/dev/null
  echo "Killing"
  kill -TERM "$pid1" 2>/dev/null
  kill -TERM "$pid2" 2>/dev/null
  kill -TERM "$pid3" 2>/dev/null
  kill -TERM "$pid4" 2>/dev/null
  kill -TERM "$pid5" 2>/dev/null
  kill -TERM "$pid6" 2>/dev/null
  kill -TERM "$pid7" 2>/dev/null
  kill -TERM "$pid8" 2>/dev/null
}

trap _term 0
#trap _term SIG

echo "Starting servers...";
#/bin/start/main/server --nodaemon &
python3 app.py 5000 &
pid1=$!
echo $pid1
python3 app.py 5001 &
pid2=$!
echo $pid2
python3 app.py 5002 &
pid3=$!
echo $pid3
python3 app.py 5003 &
pid4=$!
echo $pid4
python3 app.py 5004 &
pid5=$!
echo $pid5
python3 app.py 5005 &
pid6=$!
echo $pid6
python3 app.py 5006 &
pid7=$!
echo $pid7
python3 app.py 5007 &
pid8=$!
echo $pid8

#child=$!
wait "$pid1"
wait "$pid2"
wait "$pid3"
wait "$pid4"
wait "$pid5"
wait "$pid6"
wait "$pid7"
wait "$pid8"
#wait "$child"