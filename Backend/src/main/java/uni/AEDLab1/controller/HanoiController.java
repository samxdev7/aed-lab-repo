package uni.AEDLab1.controller;

import uni.AEDLab1.models.TorresHanoiDto;
import uni.AEDLab1.services.TorresHanoiServicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hanoi")
public class HanoiController {

    private final TorresHanoiServicio torresHanoiServicio;

    @Autowired
    public HanoiController(TorresHanoiServicio torresHanoiServicio) {
        this.torresHanoiServicio = torresHanoiServicio;
    }

    @GetMapping("/resolver/{discos}")
    public TorresHanoiDto[] resolver(@PathVariable int discos) {
        if (discos < 1 || discos > 7) {
            throw new IllegalArgumentException("El número de discos debe estar entre 1 y 7.");
        }
        return torresHanoiServicio.resolverHanoi(discos);
    }
}