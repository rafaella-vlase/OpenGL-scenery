#include "Camera.hpp"

namespace gps {

    //Camera constructor
    Camera::Camera(glm::vec3 cameraPosition, glm::vec3 cameraTarget, glm::vec3 cameraUp) {
        this->cameraPosition = cameraPosition;
        this->cameraTarget = cameraTarget;
        this->cameraUpDirection = cameraUp;

        //TODO - Update the rest of camera parameters
        this->cameraFrontDirection = glm::normalize(cameraTarget - cameraPosition);
        this->cameraRightDirection = glm::normalize(glm::cross(cameraFrontDirection, cameraUpDirection));

    }

    //return the view matrix, using the glm::lookAt() function
    glm::mat4 Camera::getViewMatrix() {
        return glm::lookAt(cameraPosition, cameraTarget, cameraUpDirection);
    }

    //update the camera internal parameters following a camera move event
    void Camera::move(MOVE_DIRECTION direction, float speed) {
        glm::vec3 cameraFront = glm::normalize(cameraTarget - cameraPosition);
        glm::vec3 cameraRight = glm::normalize(glm::cross(cameraFront, cameraUpDirection));
        glm::vec3 cameraUp = cameraUpDirection;

        glm::vec3 moveDelta(0.0f);

        switch (direction) {
            case MOVE_FORWARD:
                moveDelta = cameraFront * speed * 50.0f;
                break;
            case MOVE_BACKWARD:
                moveDelta = -cameraFront * speed * 50.0f;
                break;
            case MOVE_LEFT:
                moveDelta = -cameraRight * speed * 50.0f;
                break;
            case MOVE_RIGHT:
                moveDelta = cameraRight * speed * 50.0f;
                break;
        }

        // Update camera position
        cameraPosition += moveDelta;
        cameraTarget += moveDelta;
    }


    //update the camera internal parameters following a camera rotate event
    //yaw - camera rotation around the y axis
    //pitch - camera rotation around the x axis
    void Camera::rotate(float pitch, float yaw) {
        //TODO
        glm::vec3 direction;
        direction.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));
        direction.y = sin(glm::radians(pitch));
        direction.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));
        glm::vec3 front = glm::normalize(direction);
        cameraFrontDirection = front;
        cameraRightDirection = glm::normalize(glm::cross(cameraFrontDirection, cameraUpDirection));     
        cameraTarget = cameraPosition + cameraFrontDirection;
    }
}