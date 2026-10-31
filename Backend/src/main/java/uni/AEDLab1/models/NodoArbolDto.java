package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class NodoArbolDto {
    private int id;
    
    @NotBlank(message = "Ingrese una letra de la A-Z.")
    @Pattern(regexp = "^[A-Za-z]$", message = "La entrada debe ser una letra de la A-Z.")
    private String valor;
    
    @JsonProperty("izq")
    private NodoArbolDto izquierda;
    
    @JsonProperty("der")
    private NodoArbolDto derecha;
    
    public NodoArbolDto(int id, String valor) {
        this.id = id;
        this.valor = valor;
    }
    
    // Getters y Setters
    @JsonProperty("izq")
    public NodoArbolDto getIzquierda() { return izquierda; }
    public void setIzquierda(NodoArbolDto izquierda) { this.izquierda = izquierda; }
    
    @JsonProperty("der")
    public NodoArbolDto getDerecha() { return derecha; }
    public void setDerecha(NodoArbolDto derecha) { this.derecha = derecha; }

    @JsonProperty("id")
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    @JsonProperty("valor")
    public String getValor() { return valor; }
    public void setValor(String valor) { this.valor = valor; }
}

