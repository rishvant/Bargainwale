import { BeatLoader } from "react-spinners";

const Loader = () => {
  return (
    <div className="fixed inset-0 flex justify-center items-center z-[1050]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative z-10 text-white flex flex-col items-center space-y-4">
        <BeatLoader color="white" size={25} />
        {/* <p className="text-xl sm:text-2xl md:text-3xl font-semibold">
          Loading...
        </p> */}
      </div>
    </div>
  );
};

export default Loader;
