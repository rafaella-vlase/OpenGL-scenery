#version 410 core

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoords;

//umbre
in vec4 fragPosLightSpace;
uniform sampler2D shadowMap;

out vec4 fColor;

//matrices
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;

//lighting
uniform vec3 lightDir;
uniform vec3 lightColor;

uniform vec3 lightPunctiform;
uniform vec3 lightPunctiformColor;

uniform vec3 lightPunctiform1;
uniform vec3 lightPunctiformColor1;

// textures
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;

//components
vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;

float constant = 1.0f;
float linear = 0.045f;
float quadratic = 0.0075f;

vec4 fPosEye;
uniform int isCeata;
uniform int isShadow;
uniform int isFelinar;

void computeDirLight()
{
    //compute eye space coordinates
    fPosEye = view * model * vec4(fPosition, 1.0f);
    vec3 normalEye = normalize(normalMatrix * fNormal);

    //normalize light direction
    vec3 lightDirN = vec3(normalize(view * vec4(lightDir, 0.0f)));

    //compute view direction (in eye coordinates, the viewer is situated at the origin
    vec3 viewDir = normalize(- fPosEye.xyz);

    //compute ambient light
    ambient = ambientStrength * lightColor;

    //compute diffuse light
    diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;

    //compute specular light
    vec3 reflectDir = reflect(-lightDirN, normalEye);
    float specCoeff = pow(max(dot(viewDir, reflectDir), 0.0f), 32.0f);
    specular = specularStrength * specCoeff * lightColor;
}

vec3 computePunctiforma(vec3 diffTex, vec3 specTex) 
{
    vec3 lightPunctiformPoz = vec3(53.89f, 3.73f, 27.94f);
	fPosEye = vec4(fPosition, 1.0f);

    //compute distance to light
	float dist = length(lightPunctiformPoz - fPosEye.xyz);
	//compute attenuation
	float att = 1.0f / (constant + linear * dist + quadratic * (dist * dist));

    //transform normal
	vec3 normalEye = normalize(fNormal);
    //compute light direction
	vec3 lightDirN = normalize(lightPunctiformPoz - fPosEye.xyz);
    //compute view direction 
	vec3 viewDirN = normalize(lightPunctiformPoz - fPosEye.xyz);

    //compute ambient light
	vec3 ambientPunct = att * ambientStrength * lightPunctiformColor;
    //compute diffuse light
	vec3 diffusePunct = att * max(dot(normalEye, lightDirN), 0.0f) * lightPunctiformColor;

    vec3 halfVector = normalize(lightDirN + viewDirN);
	float specCoeff = pow(max(dot(viewDirN, halfVector), 0.3f), 32.0f);
	vec3 specularPunct = att * specularStrength * specCoeff * lightPunctiformColor;

	return min(((ambientPunct + diffusePunct) * diffTex + specularPunct * specTex ) * att * 2, 1.0f);
}

vec3 computePunctiforma1(vec3 diffTex, vec3 specTex) 
{
    vec3 lightPunctiformPoz1 = vec3(-2.54f, 0.91f, -13.29f);
	fPosEye = vec4(fPosition, 1.0f);

    //compute distance to light
	float dist = length(lightPunctiformPoz1 - fPosEye.xyz);
	//compute attenuation
	float att = 1.0f / (constant + linear * dist + quadratic * (dist * dist));

    //transform normal
	vec3 normalEye = normalize(fNormal);
    //compute light direction
	vec3 lightDirN = normalize(lightPunctiformPoz1 - fPosEye.xyz);
    //compute view direction 
	vec3 viewDirN = normalize(lightPunctiformPoz1 - fPosEye.xyz);

    //compute ambient light
	vec3 ambientPunct1 = att * ambientStrength * lightPunctiformColor1;
    //compute diffuse light
	vec3 diffusePunct1 = att * max(dot(normalEye, lightDirN), 0.0f) * lightPunctiformColor1;

    vec3 halfVector = normalize(lightDirN + viewDirN);
	float specCoeff = pow(max(dot(viewDirN, halfVector), 0.3f), 32.0f);
	vec3 specularPunct1 = att * specularStrength * specCoeff * lightPunctiformColor1;

	return min(((ambientPunct1 + diffusePunct1) * diffTex + specularPunct1 * specTex ) * att * 2, 1.0f);
}

float computeShadow()
{
	vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

	normalizedCoords = normalizedCoords * 0.5 + 0.5;
	
	if (normalizedCoords.z > 1.0f) return 0.0f;

	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;

	float currentDepth = normalizedCoords.z;

	float bias = max(0.05f * (1.0f - dot(fNormal,lightDir)), 0.05f);
	float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;	

	return shadow;
}

float computeFog()
{
    fPosEye = view * model * vec4(fPosEye);
    float fogDensity = 0.01f;
    float fragmentDistance = length(fPosEye);
    float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));

    return clamp(fogFactor, 0.0f, 1.0f);
}

void main() 
{
    vec4 texColorDiffuse = texture(diffuseTexture, fTexCoords);
    vec4 texColorSpecular = texture(specularTexture, fTexCoords);
   
    computeDirLight();

    vec3 punctLight = computePunctiforma(texColorDiffuse.rgb,texColorSpecular.rgb);

    vec3 punctLight1 = computePunctiforma1(texColorDiffuse.rgb,texColorSpecular.rgb);

    ambient *= texColorDiffuse.rgb;
	diffuse *= texColorDiffuse.rgb;
	specular *= texColorSpecular.rgb;
    
    if (isShadow == 1) {
        float shadow = computeShadow();

        vec3 color = min((ambient + (1.0f - shadow) * diffuse) + (1.0f - shadow) * specular, 1.0f);

        if (isFelinar == 1)
            color = color + punctLight + punctLight1;

        vec4 totalColor = vec4(color, 1.0f);

        if (isCeata == 1) {
            float fogFactor = computeFog();
            vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);
            fColor = fogColor * (1 - fogFactor) + totalColor * fogFactor;
        }
        else fColor = totalColor;
    } else {
        vec3 color = min((ambient + diffuse) + specular, 1.0f);

        if (isFelinar == 1)
            color = color + punctLight + punctLight1;

        vec4 totalColor = vec4(color, 1.0f);

        if (isCeata == 1) {
            float fogFactor = computeFog();
            vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);
            fColor = fogColor * (1 - fogFactor) + totalColor * fogFactor;
        }
        else fColor = totalColor;
    }
}