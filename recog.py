# -*- coding: utf-8 -*-

import time
import cv2

def main():
    camera = cv2.VideoCapture(3)

    history = 20
    bs = cv2.createBackgroundSubtractorKNN(detectShadows=True)
    bs.setHistory(history)

    cv2.namedWindow("RECING...")

    frames = 0

    bell = False
    fontFace = cv2.FONT_HERSHEY_PLAIN
    fontScale = 2
    fontcolor = (0, 255, 255)  # BGR
    thickness = 1
    lineType = 4

    while True:
        print(time.ctime(time.time()), "FRAME %d" % frames, end="\r")
        grabbed, frame = camera.read()
        if (grabbed is False):
            print("Failed to grab frame.")
            break

        fgmask = bs.apply(frame)
        if frames < history:
            frames += 1
            continue

        th = cv2.threshold(fgmask.copy(), 64, 255, cv2.THRESH_BINARY)[1]
        th = cv2.erode(th, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)), iterations=2)
        dilated = cv2.dilate(th, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (8, 3)), iterations=2)
        contours, hier = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        counter = 0

        ymin = 190
        cyan = (255, 255, 255)
        lineWidth = 1

        # 边定点
        tx, ty, tz = 320, 380, 640

        cv2.line(frame, (0, ymin), (640, ymin), cyan, lineWidth)
        cv2.line(frame, (tx, 0), (tz, ty), cyan, lineWidth, cv2.LINE_AA)

        for c in contours:
            if cv2.contourArea(c) > 300:
                (x, y, w, h) = cv2.boundingRect(c)

                if y + h > ymin and (y+h-ty - (ty/(tz-tx))*(x-tz)) > 0:
                    bell = True
                    cv2.putText(frame, "?", (x, y), fontFace, fontScale, fontcolor, thickness, lineType)

                cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 255, 0), 1)

                counter += 1

        if bell and frames % 10 == 0:
            print("\a", end="\r")
            bell = False

        frames += 1

        frame = cv2.resize(frame, (1600, 900))
        cv2.imshow("RECING...", frame)

        if cv2.waitKey(24) & 0xff == 27:
            break
    camera.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
