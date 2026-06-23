import { describe, it, expect } from "vitest"
import {
    bracketTax,
    marginalRateBp,
    interpolatePhaseout,
    applyFloorExcess,
    cap,
    chooseMax,
} from "@/tax-engine/core/primitives"
import { BRACKETS, STATUS } from "@/tax-engine/rulesets/federal/ty2024/params"

const single = BRACKETS[STATUS.single]
const C = (d: number) => d * 100

describe("bracketTax (2024 single)", () => {
    it("is zero at zero", () => {
        expect(bracketTax(0, single)).toBe(0)
    })
    it("taxes exactly the 10% bracket at its boundary", () => {
        // $11,600 fully at 10% = $1,160
        expect(bracketTax(C(11_600), single)).toBe(C(1_160))
    })
    it("matches the worked example at $65,400 taxable → $9,441", () => {
        expect(bracketTax(C(65_400), single)).toBe(C(9_441))
    })
    it("matches the spec example at $64,400 taxable → $9,221", () => {
        expect(bracketTax(C(64_400), single)).toBe(C(9_221))
    })
})

describe("marginalRateBp", () => {
    it("returns the lowest rate at low income", () => {
        expect(marginalRateBp(C(5_000), single)).toBe(1000)
    })
    it("returns 22% in the middle bracket", () => {
        expect(marginalRateBp(C(65_400), single)).toBe(2200)
    })
})

describe("floor/cap/choose/phaseout", () => {
    it("applyFloorExcess returns the excess over the floor, floored at zero", () => {
        expect(applyFloorExcess(C(10_000), C(7_500))).toBe(C(2_500))
        expect(applyFloorExcess(C(5_000), C(7_500))).toBe(0)
    })
    it("cap limits to the ceiling", () => {
        expect(cap(C(15_000), C(10_000))).toBe(C(10_000))
        expect(cap(C(8_000), C(10_000))).toBe(C(8_000))
    })
    it("chooseMax picks the larger", () => {
        expect(chooseMax(C(14_600), C(9_200))).toBe(C(14_600))
    })
    it("interpolatePhaseout is full below start, zero above end, linear between", () => {
        expect(interpolatePhaseout(C(2_000), C(40_000), C(50_000), C(60_000))).toBe(C(2_000))
        expect(interpolatePhaseout(C(2_000), C(70_000), C(50_000), C(60_000))).toBe(0)
        expect(interpolatePhaseout(C(2_000), C(55_000), C(50_000), C(60_000))).toBe(C(1_000))
    })
})
