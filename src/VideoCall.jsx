import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function VideoCall() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const myVideo = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
  setCallEnded(true);
  socket.emit('endCall', { to: caller || idToCall });
  window.location.reload();
};

  return (
    <div>
      <div className="flex flex-row h-full w-full justify-center gap-[15%] h-screen z-">
        <div>
          <div className="flex-grow flex flex-col items-center justify-center h-[100%]">
            <span className="text-white font-bold text-3xl mb-4">Basic React Video Call</span>
            <span className="text-white font-bold text-md mb-4 text-center underline">
              Copy your ID and anyone using the same server can use it to call you and vice versa
            </span>
            <div className="flex flex-row gap-8">
              <div className="flex flex-col items-center justify-center w-full">
                <div className="video">
                  {stream && (
                    <video
                      playsInline
                      muted
                      ref={myVideo}
                      autoPlay
                      style={{ width: "26rem", transform: "scaleX(-1)" }}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center w-full">
                  <video
                    className="user-video"
                    playsInline
                    ref={userVideo}
                    autoPlay
                    style={{ width: "26rem", height: "100%", transform: "scaleX(-1)" }}
                  />
              </div>
            </div>
            <div className="mt-5 mb-5 text-left">
            {caller ? (
              <span className="text-white font-bold text-lg mb-4">Caller ID: {caller ? caller : me}</span>
              ) : (
                <span className="text-white font-bold text-lg mb-4">{callAccepted ? "You initiated this call" : "Initiate call"}</span>
              ) }
              
              <p className="text-white">My ID: {me}</p>
            
              {callAccepted && !callEnded ? (
                <button className="text-black hover:text-gray-400 mr-6 font-bold bg-white rounded-md m-4 px-2" onClick={leaveCall}>
                  End Call
                </button>
              ) : null }

              {!callAccepted && !receivingCall ? (
                <><input
                  type="text"
                  className="text-black"
                  value={idToCall}
                  onChange={(e) => {
                    setIdToCall(e.target.value);
                  } } /><button
                    className="text-black hover:text-gray-400 mr-6 font-bold bg-white rounded-md m-4 px-2"
                    onClick={() => callUser(idToCall)}
                  >
                    Call
                  </button></>
              ) : null}
            </div>
            <div className="text-white">
              {receivingCall && !callAccepted ? (
                <div className="caller flex flex-col mt-4">
                  <h1 className="text-white">{caller} is calling...</h1>
                  <button
                    className="text-black text-xl hover:text-gray-400 mr-6 font-bold bg-white rounded-md m-4 px-2"
                    onClick={answerCall}
                  >
                    Answer
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;

